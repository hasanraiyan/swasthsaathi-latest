import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REMINDER_RECURRENCES, type ReminderRecurrence } from '../schemas/reminder.schema.js';

// Status is not editable here — completing/snoozing/cancelling are their own
// endpoints, since each carries side effects (recurrence rollover, a shift)
// beyond a plain field write.
export class UpdateReminderDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ type: String, enum: REMINDER_RECURRENCES })
  @IsOptional()
  @IsIn(REMINDER_RECURRENCES)
  recurrence?: ReminderRecurrence;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
