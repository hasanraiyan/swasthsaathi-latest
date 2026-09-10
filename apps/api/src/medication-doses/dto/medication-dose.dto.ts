import { ApiProperty } from '@nestjs/swagger';
import { MEDICATION_DOSE_STATUSES, type MedicationDoseStatus } from '../schemas/medication-dose.schema.js';

export class MedicationDoseDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  medicationId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledFor: Date;

  @ApiProperty({ type: String, enum: MEDICATION_DOSE_STATUSES })
  status: MedicationDoseStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
