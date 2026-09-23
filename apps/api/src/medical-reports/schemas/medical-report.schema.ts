import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const REPORT_CATEGORIES = [
  'lab_result',
  'prescription',
  'imaging',
  'discharge_summary',
  'consultation',
  'vaccination',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_REPORT_BYTES = 15 * 1024 * 1024;

export type MedicalReportDocument = HydratedDocument<MedicalReport>;

@Schema({ _id: false })
export class MedicalReportFile {
  // GridFS file id (hex) in the `medicalReportFiles` bucket — the bytes live
  // there, not on this document.
  @Prop({ type: String, required: true })
  fileId: string;

  @Prop({ type: String, required: true })
  filename: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true })
  size: number;
}

const MedicalReportFileSchema = SchemaFactory.createForClass(MedicalReportFile);

@Schema({ timestamps: true })
export class MedicalReport {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, enum: REPORT_CATEGORIES, default: 'other' })
  category: ReportCategory;

  // When the report was issued (the lab date), not when it was uploaded.
  @Prop({ type: Date, required: true })
  reportDate: Date;

  // Lab, hospital or doctor that issued it.
  @Prop({ type: String })
  provider?: string;

  @Prop({ type: String })
  notes?: string;

  // Same ownership-validated-in-service convention as Medication.conditionId.
  @Prop({ type: String })
  conditionId?: string;

  @Prop({ type: MedicalReportFileSchema, required: true })
  file: MedicalReportFile;
}

export const MedicalReportSchema = SchemaFactory.createForClass(MedicalReport);
