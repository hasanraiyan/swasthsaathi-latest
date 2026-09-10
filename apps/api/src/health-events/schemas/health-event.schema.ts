import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const HEALTH_EVENT_TYPES = [
  'condition_added',
  'condition_resolved',
  'condition_reactivated',
  'medication_started',
  'medication_paused',
  'medication_resumed',
  'medication_stopped',
  'dose_taken',
  'dose_skipped',
  'dose_missed',
  'measurement_recorded',
  'reminder_completed',
] as const;
export type HealthEventType = (typeof HEALTH_EVENT_TYPES)[number];

export type HealthEventDocument = HydratedDocument<HealthEvent>;

// Written internally by the other Health Companion modules (see
// HealthEventsService.log) — never exposed as a write endpoint of its own.
// This is what lets "Basic Health History" show one timeline without every
// module re-inventing its own history log.
@Schema({ timestamps: true })
export class HealthEvent {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, enum: HEALTH_EVENT_TYPES, required: true })
  type: HealthEventType;

  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: Date, required: true })
  occurredAt: Date;

  @Prop({ type: String })
  refId?: string;
}

export const HealthEventSchema = SchemaFactory.createForClass(HealthEvent);
