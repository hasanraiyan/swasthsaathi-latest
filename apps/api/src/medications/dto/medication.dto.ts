import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MEDICATION_FREQUENCIES,
  MEDICATION_STATUSES,
  type MedicationFrequency,
  type MedicationStatus,
} from '../schemas/medication.schema.js';

export class MedicationDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  dosage: string;

  @ApiProperty({ type: String, enum: MEDICATION_FREQUENCIES })
  frequency: MedicationFrequency;

  @ApiProperty({ type: [String] })
  times: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @ApiPropertyOptional({ type: String })
  instructions?: string;

  @ApiPropertyOptional({ type: String })
  conditionId?: string;

  @ApiProperty({ type: String, enum: MEDICATION_STATUSES })
  status: MedicationStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
