import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

// `type` is immutable after creation — it drives the unit/label rules, so
// changing it is a delete-and-recreate, not an edit.
export class UpdateHealthMeasurementDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  secondaryValue?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
