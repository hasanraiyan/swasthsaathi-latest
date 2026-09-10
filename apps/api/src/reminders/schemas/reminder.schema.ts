import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const REMINDER_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const;
export type ReminderRecurrence = (typeof REMINDER_RECURRENCES)[number];

export const REMINDER_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export type ReminderDocument = HydratedDocument<Reminder>;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  notes?: string;

  // The next (or only, for non-recurring) due datetime. A recurring reminder
  // rolls this forward on completion instead of spawning new rows — history
  // of past completions is Basic Health History's job, not this module's.
  @Prop({ type: Date, required: true })
  scheduledFor: Date;

  @Prop({ type: String, enum: REMINDER_RECURRENCES, default: 'none' })
  recurrence: ReminderRecurrence;

  @Prop({ type: String, enum: REMINDER_STATUSES, default: 'pending' })
  status: ReminderStatus;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
