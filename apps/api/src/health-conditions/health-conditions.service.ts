import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { HealthEventsService } from '../health-events/health-events.service.js';
import type { CreateHealthConditionDto } from './dto/create-health-condition.dto.js';
import type { UpdateHealthConditionDto } from './dto/update-health-condition.dto.js';
import { HealthCondition, type HealthConditionDocument } from './schemas/health-condition.schema.js';

@Injectable()
export class HealthConditionsService {
  constructor(
    @InjectModel(HealthCondition.name) private readonly model: Model<HealthConditionDocument>,
    private readonly healthEventsService: HealthEventsService,
  ) {}

  findAllForUser(userId: string) {
    return this.model.find({ userId }).sort({ status: 1, createdAt: -1 }).lean();
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const count = await this.model.countDocuments({ _id: id, userId }).limit(1);
    return count > 0;
  }

  async create(userId: string, dto: CreateHealthConditionDto) {
    const created = await this.model.create({
      userId,
      name: dto.name,
      notes: dto.notes,
      diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : undefined,
    });
    await this.healthEventsService.log(userId, 'condition_added', `${created.name} added`, String(created._id));
    return created;
  }

  async update(userId: string, id: string, dto: UpdateHealthConditionDto) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Health condition not found');

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.notes !== undefined) existing.notes = dto.notes;
    if (dto.diagnosedAt !== undefined) existing.diagnosedAt = new Date(dto.diagnosedAt);

    if (dto.status !== undefined && dto.status !== existing.status) {
      existing.status = dto.status;
      existing.resolvedAt = dto.status === 'resolved' ? new Date() : undefined;
      await this.healthEventsService.log(
        userId,
        dto.status === 'resolved' ? 'condition_resolved' : 'condition_reactivated',
        `${existing.name} ${dto.status === 'resolved' ? 'resolved' : 'reactivated'}`,
        String(existing._id),
      );
    }

    await existing.save();
    return existing.toObject();
  }
}
