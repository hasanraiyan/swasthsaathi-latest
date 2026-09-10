import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
import { ReminderDto } from './dto/reminder.dto.js';
import { SnoozeReminderDto } from './dto/snooze-reminder.dto.js';
import { UpdateReminderDto } from './dto/update-reminder.dto.js';
import { RemindersService } from './reminders.service.js';

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOkResponse({ type: ReminderDto, isArray: true })
  list(@CurrentUserId() userId: string) {
    return this.remindersService.findAllForUser(userId);
  }

  @Post()
  @ApiBody({ type: CreateReminderDto })
  @ApiOkResponse({ type: ReminderDto })
  create(@CurrentUserId() userId: string, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReminderDto })
  @ApiOkResponse({ type: ReminderDto })
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.update(userId, id, dto);
  }

  @Post(':id/complete')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ReminderDto })
  complete(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.remindersService.complete(userId, id);
  }

  @Post(':id/snooze')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SnoozeReminderDto })
  @ApiOkResponse({ type: ReminderDto })
  snooze(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: SnoozeReminderDto) {
    return this.remindersService.snooze(userId, id, dto.minutes);
  }

  @Post(':id/cancel')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ReminderDto })
  cancel(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.remindersService.cancel(userId, id);
  }
}
