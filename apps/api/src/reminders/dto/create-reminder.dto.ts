import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REMINDER_RECURRENCES, type ReminderRecurrence } from '../schemas/reminder.schema.js';

export class CreateReminderDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  scheduledFor: string;

  @ApiPropertyOptional({ type: String, enum: REMINDER_RECURRENCES, default: 'none' })
  @IsOptional()
  @IsIn(REMINDER_RECURRENCES)
  recurrence?: ReminderRecurrence;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
