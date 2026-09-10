import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsController } from './health-events.controller.js';
import { HealthEventsService } from './health-events.service.js';
import { HealthEvent, HealthEventSchema } from './schemas/health-event.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: HealthEvent.name, schema: HealthEventSchema }])],
  controllers: [HealthEventsController],
  providers: [HealthEventsService],
  exports: [HealthEventsService],
})
export class HealthEventsModule {}
