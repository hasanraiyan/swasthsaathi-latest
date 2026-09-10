import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HEALTH_EVENT_TYPES, type HealthEventType } from '../schemas/health-event.schema.js';

export class HealthEventDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String, enum: HEALTH_EVENT_TYPES })
  type: HealthEventType;

  @ApiProperty({ type: String })
  summary: string;

  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt: Date;

  @ApiPropertyOptional({ type: String })
  refId?: string;
}
