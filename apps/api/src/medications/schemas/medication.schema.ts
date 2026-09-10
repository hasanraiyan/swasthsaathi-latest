import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const MEDICATION_FREQUENCIES = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'as_needed',
] as const;
export type MedicationFrequency = (typeof MEDICATION_FREQUENCIES)[number];

export const MEDICATION_STATUSES = ['active', 'paused', 'stopped'] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export type MedicationDocument = HydratedDocument<Medication>;

@Schema({ timestamps: true })
export class Medication {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  dosage: string;

  @Prop({ type: String, enum: MEDICATION_FREQUENCIES, required: true })
  frequency: MedicationFrequency;

  // 24h "HH:mm" clock times the dose is due each day. Empty for "as_needed".
  @Prop({ type: [String], default: [] })
  times: string[];

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: String })
  instructions?: string;

  // Not a Mongoose ref on purpose — HealthCondition ownership is validated in
  // the service, and nothing here needs a populated join.
  @Prop({ type: String })
  conditionId?: string;

  @Prop({ type: String, enum: MEDICATION_STATUSES, default: 'active' })
  status: MedicationStatus;
}

export const MedicationSchema = SchemaFactory.createForClass(Medication);
