import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsModule } from '../health-events/health-events.module.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';
import { Reminder, ReminderSchema } from './schemas/reminder.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reminder.name, schema: ReminderSchema }]),
    HealthEventsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
