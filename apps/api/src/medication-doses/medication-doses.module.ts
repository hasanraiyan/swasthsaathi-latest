import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { MedicationsModule } from '../medications/medications.module.js';
import { MedicationDosesController } from './medication-doses.controller.js';
import { MedicationDosesService } from './medication-doses.service.js';
import { MedicationDose, MedicationDoseSchema } from './schemas/medication-dose.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicationDose.name, schema: MedicationDoseSchema }]),
    MedicationsModule,
    HealthEventsModule,
  ],
  controllers: [MedicationDosesController],
  providers: [MedicationDosesService],
  exports: [MedicationDosesService],
})
export class MedicationDosesModule {}
