import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { HealthMeasurementsController } from './health-measurements.controller.js';
import { HealthMeasurementsService } from './health-measurements.service.js';
import { HealthMeasurement, HealthMeasurementSchema } from './schemas/health-measurement.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthMeasurement.name, schema: HealthMeasurementSchema }]),
    HealthEventsModule,
  ],
  controllers: [HealthMeasurementsController],
  providers: [HealthMeasurementsService],
})
export class HealthMeasurementsModule {}
