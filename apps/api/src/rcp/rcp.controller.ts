import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UpdateHealthConditionDto } from '../health-conditions/dto/update-health-condition.dto.js';
import { CreateHealthConditionDto } from '../health-conditions/dto/create-health-condition.dto.js';
import { HealthConditionsService } from '../health-conditions/health-conditions.service.js';
import { HealthEventsService } from '../health-events/health-events.service.js';
import { CreateHealthMeasurementDto } from '../health-measurements/dto/create-health-measurement.dto.js';
import { UpdateHealthMeasurementDto } from '../health-measurements/dto/update-health-measurement.dto.js';
import { HealthMeasurementsService } from '../health-measurements/health-measurements.service.js';
import type { MeasurementType } from '../health-measurements/schemas/health-measurement.schema.js';
import { UpsertHealthProfileDto } from '../health-profile/dto/upsert-health-profile.dto.js';
import { HealthProfileService } from '../health-profile/health-profile.service.js';
import { UpdateMedicalReportDto } from '../medical-reports/dto/update-medical-report.dto.js';
import { MedicalReportsService } from '../medical-reports/medical-reports.service.js';
import { RecordDoseDto } from '../medication-doses/dto/record-dose.dto.js';
import { MedicationDosesService } from '../medication-doses/medication-doses.service.js';
import { CreateMedicationDto } from '../medications/dto/create-medication.dto.js';
import { UpdateMedicationDto } from '../medications/dto/update-medication.dto.js';
import { MedicationsService } from '../medications/medications.service.js';
import { CreateReminderDto } from '../reminders/dto/create-reminder.dto.js';
import { SnoozeReminderDto } from '../reminders/dto/snooze-reminder.dto.js';
import { UpdateReminderDto } from '../reminders/dto/update-reminder.dto.js';
import { RemindersService } from '../reminders/reminders.service.js';
import {
  cleanArgs,
  pick,
  requireArg,
  requireId,
  toDto,
  toList,
  toNumber,
  unknownAction,
} from './rcp-args.js';
import { RcpAuthGuard, RcpUserId } from './rcp-auth.guard.js';

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clampInt(value: string | undefined, fallback: number, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}

// The AI-facing capability layer. Each route is one `manage_<domain>` RCP
// tool (see rcp-tools.ts) that dispatches on `action` to the same domain
// services the app's own controllers use — the Health Companion core stays
// the owner of all health state; this only translates RCP's string args.
//
// Bodies are typed `unknown` on purpose: with no DTO class the global
// ValidationPipe passes them through untouched, and each action validates
// against the module's real DTO via toDto().
@ApiExcludeController()
@UseGuards(RcpAuthGuard)
@Controller('rcp/v1')
export class RcpController {
  constructor(
    private readonly profile: HealthProfileService,
    private readonly conditions: HealthConditionsService,
    private readonly medications: MedicationsService,
    private readonly doses: MedicationDosesService,
    private readonly reminders: RemindersService,
    private readonly measurements: HealthMeasurementsService,
    private readonly reports: MedicalReportsService,
    private readonly events: HealthEventsService,
  ) {}

  @Post('summary')
  @HttpCode(200)
  async summary(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    switch (args.action) {
      case 'overview': {
        const [profile, conditions, medications, todayDoses, reminders, measurements, reports] = await Promise.all([
          this.profile.findForUser(userId),
          this.conditions.findAllForUser(userId),
          this.medications.findAllForUser(userId),
          this.doses.findTodaySchedule(userId),
          this.reminders.findAllForUser(userId),
          this.measurements.findForUser(userId),
          this.reports.findAllForUser(userId),
        ]);
        // Latest reading per type — the list is already newest-first.
        const latestMeasurements = [...new Map(measurements.map((m) => [m.type === 'other' ? `other:${m.label}` : m.type, m])).values()];
        return {
          profile,
          activeConditions: conditions.filter((c) => c.status === 'active'),
          activeMedications: medications.filter((m) => m.status === 'active'),
          todayDoses,
          upcomingReminders: reminders.filter((r) => r.status === 'pending').slice(0, 10),
          latestMeasurements,
          recentReports: reports.slice(0, 5).map(({ file: _file, ...rest }) => rest),
        };
      }
      case 'history': {
        const events = await this.events.findForUser(userId);
        return events.slice(0, clampInt(args.limit, 30, 200));
      }
      default:
        return unknownAction(args.action, ['overview', 'history']);
    }
  }

  @Post('profile')
  @HttpCode(200)
  async profileTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    switch (args.action) {
      case 'read':
        return (await this.profile.findForUser(userId)) ?? { message: 'No health profile yet.' };
      case 'update': {
        const dto = toDto(
          UpsertHealthProfileDto,
          pick(args, ['heightCm', 'weightKg', 'bloodGroup', 'allergies', 'notes'], {
            heightCm: toNumber,
            weightKg: toNumber,
            allergies: toList,
          }),
        );
        return this.profile.upsertForUser(userId, dto);
      }
      default:
        return unknownAction(args.action, ['read', 'update']);
    }
  }

  @Post('conditions')
  @HttpCode(200)
  async conditionsTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    switch (action) {
      case 'list':
        return this.conditions.findAllForUser(userId);
      case 'create':
        return this.conditions.create(userId, toDto(CreateHealthConditionDto, pick(args, ['name', 'notes', 'diagnosedAt'])));
      case 'update':
        return this.conditions.update(
          userId,
          requireId(args, action),
          toDto(UpdateHealthConditionDto, pick(args, ['name', 'notes', 'diagnosedAt'])),
        );
      case 'resolve':
      case 'reactivate':
        return this.conditions.update(
          userId,
          requireId(args, action),
          toDto(UpdateHealthConditionDto, { status: action === 'resolve' ? 'resolved' : 'active' }),
        );
      default:
        return unknownAction(action, ['list', 'create', 'update', 'resolve', 'reactivate']);
    }
  }

  @Post('medications')
  @HttpCode(200)
  async medicationsTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    const fields = ['name', 'dosage', 'frequency', 'times', 'startDate', 'endDate', 'instructions', 'conditionId'];
    switch (action) {
      case 'list':
        return this.medications.findAllForUser(userId);
      case 'read':
        return (await this.medications.findOneForUser(userId, requireId(args, action))) ?? { message: 'Medication not found' };
      case 'create':
        return this.medications.create(
          userId,
          toDto(CreateMedicationDto, { startDate: todayDate(), ...pick(args, fields, { times: toList }) }),
        );
      case 'update':
        return this.medications.update(
          userId,
          requireId(args, action),
          toDto(UpdateMedicationDto, pick(args, fields, { times: toList })),
        );
      case 'pause':
      case 'resume':
      case 'stop': {
        const status = { pause: 'paused', resume: 'active', stop: 'stopped' }[action];
        return this.medications.update(userId, requireId(args, action), toDto(UpdateMedicationDto, { status }));
      }
      default:
        return unknownAction(action, ['list', 'read', 'create', 'update', 'pause', 'resume', 'stop']);
    }
  }

  @Post('doses')
  @HttpCode(200)
  async dosesTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    switch (action) {
      case 'today':
        return this.doses.findTodaySchedule(userId);
      case 'record':
        requireId(args, action, 'medicationId');
        requireArg(args, 'scheduledFor', action);
        requireArg(args, 'status', action);
        return this.doses.recordDose(userId, toDto(RecordDoseDto, pick(args, ['medicationId', 'scheduledFor', 'status'])));
      case 'history':
        return this.doses.findHistoryForUser(userId, clampInt(args.days, 30, 365));
      default:
        return unknownAction(action, ['today', 'record', 'history']);
    }
  }

  @Post('reminders')
  @HttpCode(200)
  async remindersTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    const fields = ['title', 'scheduledFor', 'recurrence', 'notes'];
    switch (action) {
      case 'list': {
        const status = args.status ?? 'pending';
        const all = await this.reminders.findAllForUser(userId);
        return status === 'all' ? all : all.filter((r) => r.status === status);
      }
      case 'create':
        return this.reminders.create(userId, toDto(CreateReminderDto, pick(args, fields)));
      case 'update':
        return this.reminders.update(userId, requireId(args, action), toDto(UpdateReminderDto, pick(args, fields)));
      case 'complete':
        return this.reminders.complete(userId, requireId(args, action));
      case 'snooze': {
        const id = requireId(args, action);
        const dto = toDto(SnoozeReminderDto, { minutes: toNumber(requireArg(args, 'minutes', action)) });
        return this.reminders.snooze(userId, id, dto.minutes);
      }
      case 'cancel':
        return this.reminders.cancel(userId, requireId(args, action));
      default:
        return unknownAction(action, ['list', 'create', 'update', 'complete', 'snooze', 'cancel']);
    }
  }

  @Post('measurements')
  @HttpCode(200)
  async measurementsTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    const numeric = { value: toNumber, secondaryValue: toNumber };
    switch (action) {
      case 'list': {
        const list = await this.measurements.findForUser(userId, args.type as MeasurementType | undefined);
        return list.slice(0, clampInt(args.limit, 20, 200));
      }
      case 'create':
        return this.measurements.create(
          userId,
          toDto(
            CreateHealthMeasurementDto,
            pick(args, ['type', 'label', 'value', 'secondaryValue', 'unit', 'recordedAt', 'notes'], numeric),
          ),
        );
      case 'update':
        return this.measurements.update(
          userId,
          requireId(args, action),
          toDto(UpdateHealthMeasurementDto, pick(args, ['label', 'value', 'secondaryValue', 'recordedAt', 'notes'], numeric)),
        );
      case 'delete':
        await this.measurements.remove(userId, requireId(args, action));
        return { deleted: true };
      default:
        return unknownAction(action, ['list', 'create', 'update', 'delete']);
    }
  }

  @Post('reports')
  @HttpCode(200)
  async reportsTool(@RcpUserId() userId: string, @Body() body: unknown): Promise<unknown> {
    const args = cleanArgs(body);
    const action = args.action;
    switch (action) {
      case 'list':
        return this.reports.findAllForUser(userId);
      case 'read':
        return this.reports.findOneForUser(userId, requireId(args, action));
      case 'update':
        return this.reports.update(
          userId,
          requireId(args, action),
          toDto(UpdateMedicalReportDto, pick(args, ['title', 'category', 'reportDate', 'provider', 'notes'])),
        );
      case 'delete':
        await this.reports.remove(userId, requireId(args, action));
        return { deleted: true };
      default:
        return unknownAction(action, ['list', 'read', 'update', 'delete']);
    }
  }
}
