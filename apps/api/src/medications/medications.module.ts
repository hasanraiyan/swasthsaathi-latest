import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthConditionsModule } from '../health-conditions/health-conditions.module.js';
import { MedicationsController } from './medications.controller.js';
import { MedicationsService } from './medications.service.js';
import { Medication, MedicationSchema } from './schemas/medication.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Medication.name, schema: MedicationSchema }]),
    HealthConditionsModule,
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
