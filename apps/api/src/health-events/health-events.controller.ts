import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { HealthEventDto } from './dto/health-event.dto.js';
import { HealthEventsService } from './health-events.service.js';

@ApiTags('health-history')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/history')
export class HealthEventsController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  @Get()
  @ApiOkResponse({ type: HealthEventDto, isArray: true })
  list(@CurrentUserId() userId: string) {
    return this.healthEventsService.findForUser(userId);
  }
}
