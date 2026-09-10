import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { DoseHistoryResponseDto } from './dto/dose-history-response.dto.js';
import { DoseSlotDto } from './dto/dose-slot.dto.js';
import { MedicationDoseDto } from './dto/medication-dose.dto.js';
import { RecordDoseDto } from './dto/record-dose.dto.js';
import { MedicationDosesService } from './medication-doses.service.js';

@ApiTags('medication-doses')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/medications/doses')
export class MedicationDosesController {
  constructor(private readonly medicationDosesService: MedicationDosesService) {}

  @Get('today')
  @ApiOkResponse({ type: DoseSlotDto, isArray: true })
  today(@CurrentUserId() userId: string) {
    return this.medicationDosesService.findTodaySchedule(userId);
  }

  @Post()
  @ApiBody({ type: RecordDoseDto })
  @ApiOkResponse({ type: MedicationDoseDto })
  record(@CurrentUserId() userId: string, @Body() dto: RecordDoseDto) {
    return this.medicationDosesService.recordDose(userId, dto);
  }

  @Get('history')
  @ApiQuery({ name: 'days', type: Number, required: false })
  @ApiOkResponse({ type: DoseHistoryResponseDto })
  history(
    @CurrentUserId() userId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.medicationDosesService.findHistoryForUser(userId, days);
  }
}
