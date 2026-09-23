import { Module } from '@nestjs/common';
import { HealthConditionsModule } from '../health-conditions/health-conditions.module.js';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { HealthMeasurementsModule } from '../health-measurements/health-measurements.module.js';
import { HealthProfileModule } from '../health-profile/health-profile.module.js';
import { MedicalReportsModule } from '../medical-reports/medical-reports.module.js';
import { MedicationDosesModule } from '../medication-doses/medication-doses.module.js';
import { MedicationsModule } from '../medications/medications.module.js';
import { RemindersModule } from '../reminders/reminders.module.js';
import { RcpController } from './rcp.controller.js';

@Module({
  imports: [
    HealthProfileModule,
    HealthConditionsModule,
    MedicationsModule,
    MedicationDosesModule,
    RemindersModule,
    HealthMeasurementsModule,
    MedicalReportsModule,
    HealthEventsModule,
  ],
  controllers: [RcpController],
})
export class RcpModule {}
