import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class SnoozeReminderDto {
  @ApiProperty({ type: Number, minimum: 1, maximum: 1440, description: 'Minutes to push the reminder back by' })
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes: number;
}
