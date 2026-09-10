import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BLOOD_GROUPS, type BloodGroup } from '../schemas/health-profile.schema.js';

export class HealthProfileDto {
  @ApiProperty({ type: String })
  userId: string;

  @ApiPropertyOptional({ type: Number, description: 'Height in centimetres' })
  heightCm?: number;

  @ApiPropertyOptional({ type: Number, description: 'Weight in kilograms' })
  weightKg?: number;

  @ApiPropertyOptional({ type: String, enum: BLOOD_GROUPS })
  bloodGroup?: BloodGroup;

  @ApiProperty({ type: [String] })
  allergies: string[];

  @ApiPropertyOptional({ type: String, description: 'Freeform basic health history / notes' })
  notes?: string;
}
