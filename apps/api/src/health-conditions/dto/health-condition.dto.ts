import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HEALTH_CONDITION_STATUSES, type HealthConditionStatus } from '../schemas/health-condition.schema.js';

export class HealthConditionDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, enum: HEALTH_CONDITION_STATUSES })
  status: HealthConditionStatus;

  @ApiPropertyOptional({ type: String })
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  diagnosedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  resolvedAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
