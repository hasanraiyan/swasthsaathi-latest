import type { PersonaModuleOptions } from '@personaai/adapters/nestjs';
import { REPORT_CATEGORIES } from '../medical-reports/schemas/medical-report.schema.js';
import { MEASUREMENT_TYPES } from '../health-measurements/schemas/health-measurement.schema.js';
import { MEDICATION_FREQUENCIES } from '../medications/schemas/medication.schema.js';
import { REMINDER_RECURRENCES } from '../reminders/schemas/reminder.schema.js';
import { RCP_USER_ID_HEADER } from './rcp-auth.guard.js';

// The RcpTool shape as @personaai/adapters itself declares it — no direct
// rcp-sdk dependency needed just to name the type.
type RcpTool = NonNullable<PersonaModuleOptions['rcpManifest']>['tools'][number];

// The Clerk user id this call acts for. Declared on every tool, but mapped
// on the Persona side (RCP source param mapping) so it's filled by Persona
// and never exposed to — or chosen by — the model.
export const RCP_USER_ID_PARAM = 'userId';

interface ToolParam {
  name: string;
  description: string;
  type?: 'string' | 'number' | 'boolean';
}

interface ManageToolSpec {
  name: string;
  // Path segment under /rcp/v1/ — also the controller route.
  path: string;
  description: string;
  actions: readonly string[];
  params: ToolParam[];
}

const oneOf = (values: readonly string[]) => values.map((v) => `"${v}"`).join(', ');

const ISO_DATETIME = 'ISO 8601 with timezone offset, e.g. "2026-09-23T20:00:00+05:30"';

// One `manage_<domain>` tool per Health Companion module, each dispatching on
// `action` — keeps the model's tool list short while still covering every
// capability. Every RCP value arrives as a string (optional ones as ""), so
// the controller does the typing; see rcp-args.ts.
export const MANAGE_TOOL_SPECS: ManageToolSpec[] = [
  {
    name: 'manage_health_summary',
    path: 'summary',
    description:
      "Read-only snapshot of the user's health. " +
      '"overview": profile, active conditions and medications, today\'s doses, upcoming reminders, latest measurements, recent reports — call this first when you need context. ' +
      '"history": the recent health timeline (doses taken, measurements, reports, etc.).',
    actions: ['overview', 'history'],
    params: [{ name: 'limit', type: 'number', description: 'history: max events to return (default 30)' }],
  },
  {
    name: 'manage_profile',
    path: 'profile',
    description: 'Read or update the user\'s health profile (height, weight, blood group, allergies, notes). "update" only changes the fields you pass.',
    actions: ['read', 'update'],
    params: [
      { name: 'heightCm', type: 'number', description: 'Height in centimetres' },
      { name: 'weightKg', type: 'number', description: 'Weight in kilograms' },
      { name: 'bloodGroup', description: 'e.g. "A+", "O-"' },
      { name: 'allergies', description: 'Comma-separated list — replaces the existing list' },
      { name: 'notes', description: 'Freeform basic health history' },
    ],
  },
  {
    name: 'manage_conditions',
    path: 'conditions',
    description: 'List, add, edit, resolve or reactivate the user\'s health conditions (e.g. diabetes, hypertension).',
    actions: ['list', 'create', 'update', 'resolve', 'reactivate'],
    params: [
      { name: 'id', description: 'Condition id — required for update/resolve/reactivate (get it from "list")' },
      { name: 'name', description: 'create (required) / update' },
      { name: 'notes', description: 'create / update' },
      { name: 'diagnosedAt', description: 'create / update — date, e.g. "2024-03-01"' },
    ],
  },
  {
    name: 'manage_medications',
    path: 'medications',
    description:
      "Manage the user's medications. \"list\" returns all of them (active first); \"create\" adds one and automatically schedules its daily dose reminders at `times`; " +
      '"pause" / "resume" / "stop" change its status.',
    actions: ['list', 'read', 'create', 'update', 'pause', 'resume', 'stop'],
    params: [
      { name: 'id', description: 'Medication id — required for read/update/pause/resume/stop' },
      { name: 'name', description: 'create (required) / update — e.g. "Metformin"' },
      { name: 'dosage', description: 'create (required) / update — e.g. "500 mg"' },
      { name: 'frequency', description: `create (required) / update — one of ${oneOf(MEDICATION_FREQUENCIES)}` },
      {
        name: 'times',
        description: 'create / update — comma-separated 24h reminder times, e.g. "08:00,20:00". Leave empty for as_needed.',
      },
      { name: 'startDate', description: 'create (defaults to today) / update — date, e.g. "2026-09-23"' },
      { name: 'endDate', description: 'create / update — last day, e.g. "2026-10-07"' },
      { name: 'instructions', description: 'create / update — e.g. "after food"' },
      { name: 'conditionId', description: 'create / update — link to one of the user\'s conditions' },
    ],
  },
  {
    name: 'manage_doses',
    path: 'doses',
    description:
      'Track medicine doses. "today": today\'s dose schedule with each slot\'s status (pending/taken/skipped/missed). ' +
      '"record": mark one slot taken, skipped or missed — use medicationId and scheduledFor exactly as returned by "today". ' +
      '"history": past doses plus adherence percentage.',
    actions: ['today', 'record', 'history'],
    params: [
      { name: 'medicationId', description: 'record (required)' },
      { name: 'scheduledFor', description: 'record (required) — the slot\'s scheduledFor, copied from "today"' },
      { name: 'status', description: 'record (required) — "taken", "skipped" or "missed"' },
      { name: 'days', type: 'number', description: 'history — how many days back (default 30)' },
    ],
  },
  {
    name: 'manage_reminders',
    path: 'reminders',
    description:
      'General health reminders (check BP, drink water, doctor follow-up, …). Medicine dose reminders come from manage_medications, not here. ' +
      '"list" shows pending ones by default; "complete" on a recurring reminder rolls it to the next occurrence.',
    actions: ['list', 'create', 'update', 'complete', 'snooze', 'cancel'],
    params: [
      { name: 'id', description: 'Reminder id — required for update/complete/snooze/cancel' },
      { name: 'title', description: 'create (required) / update' },
      { name: 'scheduledFor', description: `create (required) / update — ${ISO_DATETIME}` },
      { name: 'recurrence', description: `create / update — one of ${oneOf(REMINDER_RECURRENCES)} (default "none")` },
      { name: 'notes', description: 'create / update' },
      { name: 'minutes', type: 'number', description: 'snooze (required) — minutes to push back, 1–1440' },
      { name: 'status', description: 'list — "pending" (default), "completed", "cancelled" or "all"' },
    ],
  },
  {
    name: 'manage_measurements',
    path: 'measurements',
    description: 'Record and review health measurements (weight, blood pressure, glucose, heart rate, temperature, SpO2). Units are fixed per type (kg, mmHg, mg/dL, bpm, °C, %).',
    actions: ['list', 'create', 'update', 'delete'],
    params: [
      { name: 'id', description: 'Measurement id — required for update/delete' },
      { name: 'type', description: `create (required) / list filter — one of ${oneOf(MEASUREMENT_TYPES)}` },
      { name: 'value', type: 'number', description: 'create (required) / update — systolic for blood_pressure' },
      { name: 'secondaryValue', type: 'number', description: 'Diastolic — required for blood_pressure' },
      { name: 'label', description: 'Required when type is "other", e.g. "Steps"' },
      { name: 'unit', description: 'Required when type is "other", e.g. "steps"' },
      { name: 'recordedAt', description: `create / update — defaults to now; ${ISO_DATETIME}` },
      { name: 'notes', description: 'create / update' },
      { name: 'limit', type: 'number', description: 'list — max results (default 20)' },
    ],
  },
  {
    name: 'manage_reports',
    path: 'reports',
    description:
      "The user's uploaded medical reports (lab results, prescriptions, scans…). Metadata only — the files themselves are uploaded and viewed in the app's Reports page; ask the user to upload there.",
    actions: ['list', 'read', 'update', 'delete'],
    params: [
      { name: 'id', description: 'Report id — required for read/update/delete' },
      { name: 'title', description: 'update' },
      { name: 'category', description: `update — one of ${oneOf(REPORT_CATEGORIES)}` },
      { name: 'reportDate', description: 'update — date the report was issued, e.g. "2026-09-01"' },
      { name: 'provider', description: 'update — lab / hospital / doctor' },
      { name: 'notes', description: 'update' },
    ],
  },
];

export function buildRcpTools(publicBaseUrl: string): RcpTool[] {
  const base = publicBaseUrl.replace(/\/+$/, '');

  return MANAGE_TOOL_SPECS.map((spec) => ({
    name: spec.name,
    description: spec.description,
    method: 'POST',
    url: `${base}/rcp/v1/${spec.path}`,
    params: [
      { name: 'action', type: 'string', required: true, description: `One of ${oneOf(spec.actions)}` },
      ...spec.params.map((p) => ({ name: p.name, type: p.type ?? 'string', required: false, description: p.description })),
      {
        name: RCP_USER_ID_PARAM,
        type: 'string',
        required: true,
        description: 'Clerk user id — mapped by Persona, never set by the model',
      },
    ],
    headers: { [RCP_USER_ID_HEADER]: `{{${RCP_USER_ID_PARAM}}}` },
    body: Object.fromEntries([['action', '{{action}}'], ...spec.params.map((p) => [p.name, `{{${p.name}}}`])]),
  }));
}
