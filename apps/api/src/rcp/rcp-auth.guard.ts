import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { RCP_USER_ID_PARAM } from './rcp-tools.js';

type RcpRequest = Request & { rcpUserId?: string };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// `Authorization: Bearer <RCP_SECRET>` proves the caller is Persona (it sends
// the RCP source's secret on every call, per the manifest's header auth).
// Only then is the body's `userId` trusted: it's the Clerk user id Persona
// mapped into the tool's `userId` param for this chat (the model never sees
// or sets it).
@Injectable()
export class RcpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RcpRequest>();

    const rcpSecret = process.env.RCP_SECRET;
    if (!rcpSecret) throw new ServiceUnavailableException('RCP is not configured on this server');

    const auth = request.headers.authorization ?? '';
    if (!safeEqual(auth, `Bearer ${rcpSecret}`)) throw new UnauthorizedException('Invalid RCP credential');

    const body = request.body as Record<string, unknown> | undefined;
    const raw = body?.[RCP_USER_ID_PARAM];
    const userId = typeof raw === 'string' ? raw.trim() : undefined;
    // Clerk user ids look like "user_2abc…". Anything else (empty, an
    // unresolved "{{userId}}" template, junk) means the mapping didn't fill
    // it — refuse rather than create records under a bogus id.
    if (!userId || !/^user_[A-Za-z0-9]+$/.test(userId)) throw new UnauthorizedException('Missing user identity');

    request.rcpUserId = userId;
    return true;
  }
}

// Safe to assume non-null: every route using this sits behind RcpAuthGuard.
export const RcpUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<RcpRequest>().rcpUserId as string;
});
