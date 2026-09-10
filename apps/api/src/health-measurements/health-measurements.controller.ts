import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateHealthMeasurementDto } from './dto/create-health-measurement.dto.js';
import { HealthMeasurementDto } from './dto/health-measurement.dto.js';
import { UpdateHealthMeasurementDto } from './dto/update-health-measurement.dto.js';
import { HealthMeasurementsService } from './health-measurements.service.js';
import { MEASUREMENT_TYPES, type MeasurementType } from './schemas/health-measurement.schema.js';

@ApiTags('health-measurements')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/measurements')
export class HealthMeasurementsController {
  constructor(private readonly healthMeasurementsService: HealthMeasurementsService) {}

  @Get()
  @ApiQuery({ name: 'type', enum: MEASUREMENT_TYPES, required: false })
  @ApiOkResponse({ type: HealthMeasurementDto, isArray: true })
  list(@CurrentUserId() userId: string, @Query('type') type?: MeasurementType) {
    return this.healthMeasurementsService.findForUser(userId, type);
  }

  @Post()
  @ApiBody({ type: CreateHealthMeasurementDto })
  @ApiOkResponse({ type: HealthMeasurementDto })
  create(@CurrentUserId() userId: string, @Body() dto: CreateHealthMeasurementDto) {
    return this.healthMeasurementsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateHealthMeasurementDto })
  @ApiOkResponse({ type: HealthMeasurementDto })
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHealthMeasurementDto,
  ) {
    return this.healthMeasurementsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.healthMeasurementsService.remove(userId, id);
  }
}
