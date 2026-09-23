import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto.js';
import { MedicalReportDto } from './dto/medical-report.dto.js';
import { UpdateMedicalReportDto } from './dto/update-medical-report.dto.js';
import { MedicalReportsService, type UploadedReportFile } from './medical-reports.service.js';
import { MAX_REPORT_BYTES, REPORT_CATEGORIES } from './schemas/medical-report.schema.js';

@ApiTags('medical-reports')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health/reports')
export class MedicalReportsController {
  constructor(private readonly medicalReportsService: MedicalReportsService) {}

  @Get()
  @ApiOkResponse({ type: MedicalReportDto, isArray: true })
  list(@CurrentUserId() userId: string) {
    return this.medicalReportsService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: MedicalReportDto })
  get(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.medicalReportsService.findOneForUser(userId, id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_REPORT_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'reportDate'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF, JPEG, PNG or WebP — max 15 MB' },
        title: { type: 'string' },
        category: { type: 'string', enum: [...REPORT_CATEGORIES] },
        reportDate: { type: 'string', format: 'date' },
        provider: { type: 'string' },
        notes: { type: 'string' },
        conditionId: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: MedicalReportDto })
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateMedicalReportDto,
    @UploadedFile() file: UploadedReportFile | undefined,
  ) {
    return this.medicalReportsService.create(userId, dto, file);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateMedicalReportDto })
  @ApiOkResponse({ type: MedicalReportDto })
  update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateMedicalReportDto) {
    return this.medicalReportsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.medicalReportsService.remove(userId, id);
  }

  @Get(':id/file')
  @ApiParam({ name: 'id', type: String })
  @ApiProduces('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  async file(@CurrentUserId() userId: string, @Param('id') id: string) {
    const { stream, filename, mimeType, size } = await this.medicalReportsService.openFile(userId, id);
    return new StreamableFile(stream, {
      type: mimeType,
      length: size,
      disposition: `inline; filename="${encodeURIComponent(filename)}"`,
    });
  }
}
