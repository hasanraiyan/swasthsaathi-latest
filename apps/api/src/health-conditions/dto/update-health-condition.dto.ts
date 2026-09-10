import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { HEALTH_CONDITION_STATUSES, type HealthConditionStatus } from '../schemas/health-condition.schema.js';

export class UpdateHealthConditionDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  diagnosedAt?: string;

  @ApiPropertyOptional({ type: String, enum: HEALTH_CONDITION_STATUSES })
  @IsOptional()
  @IsIn(HEALTH_CONDITION_STATUSES)
  status?: HealthConditionStatus;
}
