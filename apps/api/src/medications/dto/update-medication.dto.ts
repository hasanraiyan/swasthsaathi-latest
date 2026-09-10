import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  MEDICATION_FREQUENCIES,
  MEDICATION_STATUSES,
  type MedicationFrequency,
  type MedicationStatus,
} from '../schemas/medication.schema.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateMedicationDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @ApiPropertyOptional({ type: String, enum: MEDICATION_FREQUENCIES })
  @IsOptional()
  @IsIn(MEDICATION_FREQUENCIES)
  frequency?: MedicationFrequency;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Matches(TIME_PATTERN, { each: true })
  times?: string[];

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  conditionId?: string;

  @ApiPropertyOptional({ type: String, enum: MEDICATION_STATUSES })
  @IsOptional()
  @IsIn(MEDICATION_STATUSES)
  status?: MedicationStatus;
}
