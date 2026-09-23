import { BadRequestException } from '@nestjs/common';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';

// Every RCP param is rendered into the body as a string, and an optional one
// the model left out arrives as "" (rcp-sdk renders missing values that way).
// These helpers turn that into the typed values the existing DTOs expect, so
// RCP calls go through exactly the same validation rules as the app's own
// endpoints rather than a second, drifting copy of them.
export type RcpArgs = Record<string, string>;

export function cleanArgs(body: unknown): RcpArgs {
  const out: RcpArgs = {};
  if (!body || typeof body !== 'object') return out;
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text !== '') out[key] = text;
  }
  return out;
}

export function requireArg(args: RcpArgs, name: string, action: string): string {
  const value = args[name];
  if (value === undefined) throw new BadRequestException(`"${name}" is required for action "${action}"`);
  return value;
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export function requireId(args: RcpArgs, action: string, name = 'id'): string {
  const id = requireArg(args, name, action);
  if (!OBJECT_ID.test(id)) throw new BadRequestException(`"${name}" is not a valid id — get ids from the "list" action`);
  return id;
}

export function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : (value as unknown as number); // let the DTO reject it with a clear message
}

export function toList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Picks `keys` out of args, applying per-key converters, dropping absent ones.
export function pick(
  args: RcpArgs,
  keys: string[],
  convert: Record<string, (v: string | undefined) => unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const value = convert[key] ? convert[key](args[key]) : args[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function toDto<T extends object>(cls: ClassConstructor<T>, plain: Record<string, unknown>): T {
  const instance = plainToInstance(cls, plain);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException(messages);
  }
  return instance;
}

export function unknownAction(action: string | undefined, allowed: readonly string[]): never {
  throw new BadRequestException(
    action ? `Unknown action "${action}". Use one of: ${allowed.join(', ')}` : `"action" is required: ${allowed.join(', ')}`,
  );
}
