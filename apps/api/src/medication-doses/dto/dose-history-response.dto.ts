import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicationDoseDto } from './medication-dose.dto.js';

export class DoseHistoryResponseDto {
  @ApiProperty({ type: MedicationDoseDto, isArray: true })
  doses: MedicationDoseDto[];

  @ApiPropertyOptional({ type: Number, description: 'Percent of recorded doses marked taken, over the requested window. Null with no recorded doses.' })
  adherencePercent: number | null;
}
