import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { MEDICATION_FREQUENCIES, type MedicationFrequency } from '../schemas/medication.schema.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateMedicationDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ type: String, description: 'e.g. "500 mg"' })
  @IsString()
  @MaxLength(100)
  dosage: string;

  @ApiProperty({ type: String, enum: MEDICATION_FREQUENCIES })
  @IsIn(MEDICATION_FREQUENCIES)
  frequency: MedicationFrequency;

  @ApiPropertyOptional({ type: [String], description: '24h "HH:mm" times, e.g. ["08:00", "20:00"]' })
  @IsOptional()
  @IsArray()
  @Matches(TIME_PATTERN, { each: true })
  times?: string[];

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  startDate: string;

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
}
