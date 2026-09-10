import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateHealthConditionDto } from './dto/create-health-condition.dto.js';
import { HealthConditionDto } from './dto/health-condition.dto.js';
import { UpdateHealthConditionDto } from './dto/update-health-condition.dto.js';
import { HealthConditionsService } from './health-conditions.service.js';

@ApiTags('health-conditions')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/conditions')
export class HealthConditionsController {
  constructor(private readonly healthConditionsService: HealthConditionsService) {}

  @Get()
  @ApiOkResponse({ type: HealthConditionDto, isArray: true })
  list(@CurrentUserId() userId: string) {
    return this.healthConditionsService.findAllForUser(userId);
  }

  @Post()
  @ApiBody({ type: CreateHealthConditionDto })
  @ApiOkResponse({ type: HealthConditionDto })
  create(@CurrentUserId() userId: string, @Body() dto: CreateHealthConditionDto) {
    return this.healthConditionsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateHealthConditionDto })
  @ApiOkResponse({ type: HealthConditionDto })
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHealthConditionDto,
  ) {
    return this.healthConditionsService.update(userId, id, dto);
  }
}
