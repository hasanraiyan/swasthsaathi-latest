import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { HealthConditionsController } from './health-conditions.controller.js';
import { HealthConditionsService } from './health-conditions.service.js';
import { HealthCondition, HealthConditionSchema } from './schemas/health-condition.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthCondition.name, schema: HealthConditionSchema }]),
    HealthEventsModule,
  ],
  controllers: [HealthConditionsController],
  providers: [HealthConditionsService],
  exports: [HealthConditionsService],
})
export class HealthConditionsModule {}
