import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateReminderDto } from './dto/create-reminder.dto.js';
import type { UpdateReminderDto } from './dto/update-reminder.dto.js';
import { Reminder, type ReminderDocument, type ReminderRecurrence } from './schemas/reminder.schema.js';

function nextOccurrence(from: Date, recurrence: ReminderRecurrence): Date {
  const next = new Date(from);
  if (recurrence === 'daily') next.setDate(next.getDate() + 1);
  else if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
  else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

@Injectable()
export class RemindersService {
  constructor(
    @InjectModel(Reminder.name) private readonly model: Model<ReminderDocument>,
  ) {}

  findAllForUser(userId: string) {
    return this.model.find({ userId }).sort({ status: 1, scheduledFor: 1 }).lean();
  }

  create(userId: string, dto: CreateReminderDto) {
    return this.model.create({
      userId,
      title: dto.title,
      notes: dto.notes,
      scheduledFor: new Date(dto.scheduledFor),
      recurrence: dto.recurrence ?? 'none',
    });
  }

  private async findOwned(userId: string, id: string) {
    const existing = await this.model.findOne({ _id: id, userId });
    if (!existing) throw new NotFoundException('Reminder not found');
    return existing;
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    const existing = await this.findOwned(userId, id);

    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.notes !== undefined) existing.notes = dto.notes;
    if (dto.scheduledFor !== undefined) existing.scheduledFor = new Date(dto.scheduledFor);
    if (dto.recurrence !== undefined) existing.recurrence = dto.recurrence;

    await existing.save();
    return existing.toObject();
  }

  // Recurring reminders roll forward and stay pending; one-off reminders end here.
  async complete(userId: string, id: string) {
    const existing = await this.findOwned(userId, id);
    if (existing.recurrence === 'none') {
      existing.status = 'completed';
    } else {
      existing.scheduledFor = nextOccurrence(existing.scheduledFor, existing.recurrence);
    }
    await existing.save();
    return existing.toObject();
  }

  async snooze(userId: string, id: string, minutes: number) {
    const existing = await this.findOwned(userId, id);
    existing.scheduledFor = new Date(existing.scheduledFor.getTime() + minutes * 60_000);
    await existing.save();
    return existing.toObject();
  }

  async cancel(userId: string, id: string) {
    const existing = await this.findOwned(userId, id);
    existing.status = 'cancelled';
    await existing.save();
    return existing.toObject();
  }
}
