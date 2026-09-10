import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto.js';
import { HealthProfile, type HealthProfileDocument } from './schemas/health-profile.schema.js';

@Injectable()
export class HealthProfileService {
  constructor(
    @InjectModel(HealthProfile.name) private readonly model: Model<HealthProfileDocument>,
  ) {}

  findForUser(userId: string) {
    return this.model.findOne({ userId }).lean();
  }

  upsertForUser(userId: string, dto: UpsertHealthProfileDto) {
    return this.model
      .findOneAndUpdate(
        { userId },
        { $set: dto },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }
}
