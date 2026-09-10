import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { HealthConditionsService } from '../health-conditions/health-conditions.service.js';
import { HealthEventsService } from '../health-events/health-events.service.js';
import type { CreateMedicationDto } from './dto/create-medication.dto.js';
import type { UpdateMedicationDto } from './dto/update-medication.dto.js';
import { Medication, type MedicationDocument } from './schemas/medication.schema.js';

const STATUS_EVENT = {
  paused: 'medication_paused',
  active: 'medication_resumed',
  stopped: 'medication_stopped',
} as const;

@Injectable()
export class MedicationsService {
  constructor(
    @InjectModel(Medication.name) private readonly model: Model<MedicationDocument>,
    private readonly healthConditionsService: HealthConditionsService,
    private readonly healthEventsService: HealthEventsService,
  ) {}

  findAllForUser(userId: string) {
    return this.model.find({ userId }).sort({ status: 1, startDate: -1 }).lean();
  }

  findOneForUser(userId: string, id: string) {
    return this.model.findOne({ _id: id, userId }).lean();
  }

  // Active medications whose start/end range covers `date` — the set a
  // day's dose reminders are generated from.
  findActiveForUserOnDate(userId: string, date: Date) {
    return this.model
      .find({
        userId,
        status: 'active',
        startDate: { $lte: date },
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: date } }],
      })
      .lean();
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const count = await this.model.countDocuments({ _id: id, userId }).limit(1);
    return count > 0;
  }

  private async assertConditionOwnership(userId: string, conditionId: string | undefined) {
    if (!conditionId) return;
    const owned = await this.healthConditionsService.existsForUser(userId, conditionId);
    if (!owned) throw new BadRequestException('conditionId does not refer to one of your health conditions');
  }

  async create(userId: string, dto: CreateMedicationDto) {
    await this.assertConditionOwnership(userId, dto.conditionId);
    const created = await this.model.create({
      userId,
      name: dto.name,
      dosage: dto.dosage,
      frequency: dto.frequency,
      times: dto.times ?? [],
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      instructions: dto.instructions,
      conditionId: dto.conditionId,
    });
    await this.healthEventsService.log(userId, 'medication_started', `${created.name} started`, String(created._id));
    return created;
  }

  async update(userId: string, id: string, dto: UpdateMedicationDto) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Medication not found');

    if (dto.conditionId !== undefined) await this.assertConditionOwnership(userId, dto.conditionId);

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.dosage !== undefined) existing.dosage = dto.dosage;
    if (dto.frequency !== undefined) existing.frequency = dto.frequency;
    if (dto.times !== undefined) existing.times = dto.times;
    if (dto.startDate !== undefined) existing.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) existing.endDate = new Date(dto.endDate);
    if (dto.instructions !== undefined) existing.instructions = dto.instructions;
    if (dto.conditionId !== undefined) existing.conditionId = dto.conditionId;

    if (dto.status !== undefined && dto.status !== existing.status) {
      existing.status = dto.status;
      const eventType = STATUS_EVENT[dto.status];
      const verb = dto.status === 'active' ? 'resumed' : dto.status;
      await this.healthEventsService.log(userId, eventType, `${existing.name} ${verb}`, String(existing._id));
    }

    await existing.save();
    return existing.toObject();
  }
}
