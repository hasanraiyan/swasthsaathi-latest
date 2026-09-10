import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MEASUREMENT_TYPES, type MeasurementType } from '../schemas/health-measurement.schema.js';

export class CreateHealthMeasurementDto {
  @ApiProperty({ type: String, enum: MEASUREMENT_TYPES })
  @IsIn(MEASUREMENT_TYPES)
  type: MeasurementType;

  @ApiPropertyOptional({ type: String, description: 'Required when type is "other" — e.g. "Steps"' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiProperty({ type: Number, description: 'Systolic for blood_pressure' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ type: Number, description: 'Diastolic — required when type is "blood_pressure"' })
  @IsOptional()
  @IsNumber()
  secondaryValue?: number;

  @ApiPropertyOptional({ type: String, description: 'Required when type is "other" — e.g. "steps"' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Defaults to now' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
