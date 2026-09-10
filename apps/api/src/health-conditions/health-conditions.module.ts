import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthConditionsController } from './health-conditions.controller.js';
import { HealthConditionsService } from './health-conditions.service.js';
import { HealthCondition, HealthConditionSchema } from './schemas/health-condition.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthCondition.name, schema: HealthConditionSchema }]),
  ],
  controllers: [HealthConditionsController],
  providers: [HealthConditionsService],
})
export class HealthConditionsModule {}
