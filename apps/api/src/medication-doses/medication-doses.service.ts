import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { MedicationsService } from '../medications/medications.service.js';
import type { RecordDoseDto } from './dto/record-dose.dto.js';
import { MedicationDose, type MedicationDoseDocument } from './schemas/medication-dose.schema.js';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function atTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

@Injectable()
export class MedicationDosesService {
  constructor(
    @InjectModel(MedicationDose.name) private readonly model: Model<MedicationDoseDocument>,
    private readonly medicationsService: MedicationsService,
  ) {}

  async findTodaySchedule(userId: string) {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const medications = await this.medicationsService.findActiveForUserOnDate(userId, today);
    const medicationIds = medications.map((m) => String(m._id));

    const recorded = await this.model.find({
      userId,
      medicationId: { $in: medicationIds },
      scheduledFor: { $gte: dayStart, $lte: dayEnd },
    });
    const recordedByKey = new Map(
      recorded.map((dose) => [`${dose.medicationId}|${dose.scheduledFor.getTime()}`, dose.status]),
    );

    const slots = medications.flatMap((medication) =>
      medication.times.map((time) => {
        const scheduledFor = atTime(today, time);
        const key = `${medication._id}|${scheduledFor.getTime()}`;
        return {
          medicationId: String(medication._id),
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledFor,
          status: recordedByKey.get(key) ?? ('pending' as const),
        };
      }),
    );

    slots.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    return slots;
  }

  async recordDose(userId: string, dto: RecordDoseDto) {
    const owned = await this.medicationsService.existsForUser(userId, dto.medicationId);
    if (!owned) throw new BadRequestException('medicationId does not refer to one of your medications');

    return this.model
      .findOneAndUpdate(
        { userId, medicationId: dto.medicationId, scheduledFor: new Date(dto.scheduledFor) },
        { $set: { status: dto.status } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async findHistoryForUser(userId: string, days: number) {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - days + 1);

    const doses = await this.model
      .find({ userId, scheduledFor: { $gte: since } })
      .sort({ scheduledFor: -1 })
      .lean();

    const takenCount = doses.filter((d) => d.status === 'taken').length;
    const adherencePercent = doses.length ? Math.round((takenCount / doses.length) * 100) : null;

    return { doses, adherencePercent };
  }
}
