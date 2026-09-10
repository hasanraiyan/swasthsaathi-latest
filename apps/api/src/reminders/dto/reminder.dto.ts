import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  REMINDER_RECURRENCES,
  REMINDER_STATUSES,
  type ReminderRecurrence,
  type ReminderStatus,
} from '../schemas/reminder.schema.js';

export class ReminderDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiPropertyOptional({ type: String })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledFor: Date;

  @ApiProperty({ type: String, enum: REMINDER_RECURRENCES })
  recurrence: ReminderRecurrence;

  @ApiProperty({ type: String, enum: REMINDER_STATUSES })
  status: ReminderStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
