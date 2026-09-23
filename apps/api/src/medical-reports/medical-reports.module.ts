import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthConditionsModule } from '../health-conditions/health-conditions.module.js';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { MedicalReportsController } from './medical-reports.controller.js';
import { MedicalReportsService } from './medical-reports.service.js';
import { MedicalReport, MedicalReportSchema } from './schemas/medical-report.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicalReport.name, schema: MedicalReportSchema }]),
    HealthConditionsModule,
    HealthEventsModule,
  ],
  controllers: [MedicalReportsController],
  providers: [MedicalReportsService],
  exports: [MedicalReportsService],
})
export class MedicalReportsModule {}
