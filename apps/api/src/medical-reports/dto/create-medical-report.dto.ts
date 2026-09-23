import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_CATEGORIES, type ReportCategory } from '../schemas/medical-report.schema.js';

// The metadata half of a multipart upload — the file itself arrives as the
// `file` field and is handled by FileInterceptor, not validated here.
export class CreateMedicalReportDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ type: String, enum: REPORT_CATEGORIES, default: 'other' })
  @IsOptional()
  @IsIn(REPORT_CATEGORIES)
  category?: ReportCategory;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  reportDate: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  provider?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  conditionId?: string;
}
