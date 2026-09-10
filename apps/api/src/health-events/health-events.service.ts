import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { HealthEvent, type HealthEventDocument, type HealthEventType } from './schemas/health-event.schema.js';

const MAX_RESULTS = 200;

@Injectable()
export class HealthEventsService {
  constructor(
    @InjectModel(HealthEvent.name) private readonly model: Model<HealthEventDocument>,
  ) {}

  // Called by the other Health Companion modules whenever something
  // history-worthy happens — not exposed as its own write endpoint.
  log(userId: string, type: HealthEventType, summary: string, refId?: string) {
    return this.model.create({ userId, type, summary, refId, occurredAt: new Date() });
  }

  findForUser(userId: string) {
    return this.model.find({ userId }).sort({ occurredAt: -1 }).limit(MAX_RESULTS).lean();
  }
}
