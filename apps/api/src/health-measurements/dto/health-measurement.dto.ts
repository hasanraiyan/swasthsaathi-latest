import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MEASUREMENT_TYPES, type MeasurementType } from '../schemas/health-measurement.schema.js';

export class HealthMeasurementDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String, enum: MEASUREMENT_TYPES })
  type: MeasurementType;

  @ApiPropertyOptional({ type: String })
  label?: string;

  @ApiProperty({ type: Number })
  value: number;

  @ApiPropertyOptional({ type: Number })
  secondaryValue?: number;

  @ApiProperty({ type: String })
  unit: string;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt: Date;

  @ApiPropertyOptional({ type: String })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
