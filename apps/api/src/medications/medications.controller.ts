import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { MedicationDto } from './dto/medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import { MedicationsService } from './medications.service.js';

@ApiTags('medications')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  @ApiOkResponse({ type: MedicationDto, isArray: true })
  list(@CurrentUserId() userId: string) {
    return this.medicationsService.findAllForUser(userId);
  }

  @Post()
  @ApiBody({ type: CreateMedicationDto })
  @ApiOkResponse({ type: MedicationDto })
  create(@CurrentUserId() userId: string, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateMedicationDto })
  @ApiOkResponse({ type: MedicationDto })
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(userId, id, dto);
  }
}
