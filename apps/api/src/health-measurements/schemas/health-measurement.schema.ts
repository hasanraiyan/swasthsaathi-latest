import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const MEASUREMENT_TYPES = [
  'weight',
  'blood_pressure',
  'blood_glucose',
  'heart_rate',
  'temperature',
  'oxygen_level',
  'other',
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

// Canonical unit per type — fixed rather than user-choosable, so trend math
// never has to reconcile mixed units for the same type. "other" is the only
// type where the caller supplies its own unit (and a label).
export const DEFAULT_MEASUREMENT_UNITS: Record<Exclude<MeasurementType, 'other'>, string> = {
  weight: 'kg',
  blood_pressure: 'mmHg',
  blood_glucose: 'mg/dL',
  heart_rate: 'bpm',
  temperature: '°C',
  oxygen_level: '%',
};

export type HealthMeasurementDocument = HydratedDocument<HealthMeasurement>;

@Schema({ timestamps: true })
export class HealthMeasurement {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, enum: MEASUREMENT_TYPES, required: true, index: true })
  type: MeasurementType;

  // Display name for "other" measurements (e.g. "Steps"). Unused otherwise.
  @Prop({ type: String })
  label?: string;

  @Prop({ type: Number, required: true })
  value: number;

  // Diastolic reading — only meaningful when type is "blood_pressure".
  @Prop({ type: Number })
  secondaryValue?: number;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: Date, required: true })
  recordedAt: Date;

  @Prop({ type: String })
  notes?: string;
}

export const HealthMeasurementSchema = SchemaFactory.createForClass(HealthMeasurement);
