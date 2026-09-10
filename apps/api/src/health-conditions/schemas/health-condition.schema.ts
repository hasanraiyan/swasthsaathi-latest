import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const HEALTH_CONDITION_STATUSES = ['active', 'resolved'] as const;
export type HealthConditionStatus = (typeof HEALTH_CONDITION_STATUSES)[number];

export type HealthConditionDocument = HydratedDocument<HealthCondition>;

@Schema({ timestamps: true })
export class HealthCondition {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: HEALTH_CONDITION_STATUSES, default: 'active' })
  status: HealthConditionStatus;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Date })
  diagnosedAt?: Date;

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export const HealthConditionSchema = SchemaFactory.createForClass(HealthCondition);
