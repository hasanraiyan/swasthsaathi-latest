import { ApiProperty } from '@nestjs/swagger';

export const DOSE_SLOT_STATUSES = ['pending', 'taken', 'skipped', 'missed'] as const;
export type DoseSlotStatus = (typeof DOSE_SLOT_STATUSES)[number];

// A computed today's-schedule entry — not its own DB row. "pending" means no
// MedicationDose has been recorded yet for this medication+time today.
export class DoseSlotDto {
  @ApiProperty({ type: String })
  medicationId: string;

  @ApiProperty({ type: String })
  medicationName: string;

  @ApiProperty({ type: String })
  dosage: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledFor: Date;

  @ApiProperty({ type: String, enum: DOSE_SLOT_STATUSES })
  status: DoseSlotStatus;
}
