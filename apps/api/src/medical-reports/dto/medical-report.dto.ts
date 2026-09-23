import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { REPORT_CATEGORIES, type ReportCategory } from '../schemas/medical-report.schema.js';

export class MedicalReportFileDto {
  @ApiProperty({ type: String })
  fileId: string;

  @ApiProperty({ type: String })
  filename: string;

  @ApiProperty({ type: String })
  mimeType: string;

  @ApiProperty({ type: Number })
  size: number;
}

export class MedicalReportDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String, enum: REPORT_CATEGORIES })
  category: ReportCategory;

  @ApiProperty({ type: String, format: 'date-time' })
  reportDate: Date;

  @ApiPropertyOptional({ type: String })
  provider?: string;

  @ApiPropertyOptional({ type: String })
  notes?: string;

  @ApiPropertyOptional({ type: String })
  conditionId?: string;

  @ApiProperty({ type: MedicalReportFileDto })
  file: MedicalReportFileDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
