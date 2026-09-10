import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const MEDICATION_DOSE_STATUSES = ['taken', 'skipped', 'missed'] as const;
export type MedicationDoseStatus = (typeof MEDICATION_DOSE_STATUSES)[number];

export type MedicationDoseDocument = HydratedDocument<MedicationDose>;

@Schema({ timestamps: true })
export class MedicationDose {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  medicationId: string;

  // The exact datetime this dose was due — one record per medication per
  // scheduled slot, upserted on that pair so re-marking a dose updates it
  // rather than duplicating it.
  @Prop({ type: Date, required: true })
  scheduledFor: Date;

  @Prop({ type: String, enum: MEDICATION_DOSE_STATUSES, required: true })
  status: MedicationDoseStatus;
}

export const MedicationDoseSchema = SchemaFactory.createForClass(MedicationDose);
MedicationDoseSchema.index({ userId: 1, medicationId: 1, scheduledFor: 1 }, { unique: true });
