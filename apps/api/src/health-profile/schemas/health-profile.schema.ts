import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type HealthProfileDocument = HydratedDocument<HealthProfile>;

@Schema({ timestamps: true })
export class HealthProfile {
  @Prop({ type: String, required: true, unique: true, index: true })
  userId: string;

  @Prop({ type: Number })
  heightCm?: number;

  @Prop({ type: Number })
  weightKg?: number;

  @Prop({ type: String, enum: BLOOD_GROUPS })
  bloodGroup?: BloodGroup;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: String })
  notes?: string;
}

export const HealthProfileSchema = SchemaFactory.createForClass(HealthProfile);
