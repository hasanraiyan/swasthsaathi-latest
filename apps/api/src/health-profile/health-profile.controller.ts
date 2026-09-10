import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { HealthProfileDto } from './dto/health-profile.dto.js';
import { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto.js';
import { HealthProfileService } from './health-profile.service.js';

@ApiTags('health-profile')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/profile')
export class HealthProfileController {
  constructor(private readonly healthProfileService: HealthProfileService) {}

  @Get()
  @ApiOkResponse({ type: HealthProfileDto, description: 'Null if the user has not created a profile yet.' })
  get(@CurrentUserId() userId: string) {
    return this.healthProfileService.findForUser(userId);
  }

  @Put()
  @ApiBody({ type: UpsertHealthProfileDto })
  @ApiOkResponse({ type: HealthProfileDto })
  upsert(@CurrentUserId() userId: string, @Body() dto: UpsertHealthProfileDto) {
    return this.healthProfileService.upsertForUser(userId, dto);
  }
}
