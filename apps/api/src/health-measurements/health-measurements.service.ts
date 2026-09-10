import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { HealthEventsService } from '../health-events/health-events.service.js';
import type { CreateHealthMeasurementDto } from './dto/create-health-measurement.dto.js';
import type { UpdateHealthMeasurementDto } from './dto/update-health-measurement.dto.js';
import {
  DEFAULT_MEASUREMENT_UNITS,
  HealthMeasurement,
  type HealthMeasurementDocument,
  type MeasurementType,
} from './schemas/health-measurement.schema.js';

const MAX_RESULTS = 500;

const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  weight: 'Weight',
  blood_pressure: 'Blood pressure',
  blood_glucose: 'Blood glucose',
  heart_rate: 'Heart rate',
  temperature: 'Temperature',
  oxygen_level: 'Oxygen level',
  other: 'Measurement',
};

@Injectable()
export class HealthMeasurementsService {
  constructor(
    @InjectModel(HealthMeasurement.name) private readonly model: Model<HealthMeasurementDocument>,
    private readonly healthEventsService: HealthEventsService,
  ) {}

  findForUser(userId: string, type?: MeasurementType) {
    return this.model
      .find({ userId, ...(type ? { type } : {}) })
      .sort({ recordedAt: -1 })
      .limit(MAX_RESULTS)
      .lean();
  }

  async create(userId: string, dto: CreateHealthMeasurementDto) {
    const unit = this.resolveUnit(dto.type, dto.unit);
    if (dto.type === 'other' && !dto.label) {
      throw new BadRequestException('label is required when type is "other"');
    }
    if (dto.type === 'blood_pressure' && dto.secondaryValue === undefined) {
      throw new BadRequestException('secondaryValue (diastolic) is required when type is "blood_pressure"');
    }

    const created = await this.model.create({
      userId,
      type: dto.type,
      label: dto.type === 'other' ? dto.label : undefined,
      value: dto.value,
      secondaryValue: dto.type === 'blood_pressure' ? dto.secondaryValue : undefined,
      unit,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      notes: dto.notes,
    });

    const name = created.type === 'other' ? created.label : MEASUREMENT_LABELS[created.type];
    const displayValue =
      created.type === 'blood_pressure' ? `${created.value}/${created.secondaryValue}` : `${created.value}`;
    await this.healthEventsService.log(
      userId,
      'measurement_recorded',
      `${name} recorded: ${displayValue} ${created.unit}`,
      String(created._id),
    );

    return created;
  }

  private resolveUnit(type: MeasurementType, providedUnit: string | undefined): string {
    if (type === 'other') {
      if (!providedUnit) throw new BadRequestException('unit is required when type is "other"');
      return providedUnit;
    }
    return DEFAULT_MEASUREMENT_UNITS[type];
  }

  async update(userId: string, id: string, dto: UpdateHealthMeasurementDto) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Measurement not found');

    if (dto.label !== undefined && existing.type === 'other') existing.label = dto.label;
    if (dto.value !== undefined) existing.value = dto.value;
    if (dto.secondaryValue !== undefined && existing.type === 'blood_pressure') {
      existing.secondaryValue = dto.secondaryValue;
    }
    if (dto.recordedAt !== undefined) existing.recordedAt = new Date(dto.recordedAt);
    if (dto.notes !== undefined) existing.notes = dto.notes;

    await existing.save();
    return existing.toObject();
  }

  async remove(userId: string, id: string) {
    const result = await this.model.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) throw new NotFoundException('Measurement not found');
  }
}
