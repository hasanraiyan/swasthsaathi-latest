import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsString } from 'class-validator';
import { MEDICATION_DOSE_STATUSES, type MedicationDoseStatus } from '../schemas/medication-dose.schema.js';

export class RecordDoseDto {
  @ApiProperty({ type: String })
  @IsString()
  medicationId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  scheduledFor: string;

  @ApiProperty({ type: String, enum: MEDICATION_DOSE_STATUSES })
  @IsIn(MEDICATION_DOSE_STATUSES)
  status: MedicationDoseStatus;
}
