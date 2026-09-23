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

// Every tool sends this, filled from its `userId` param — which the Persona
// RCP source maps, so the model never supplies it. See rcp-tools.ts.
export const RCP_USER_ID_HEADER = 'x-ss-user-id';

type RcpRequest = Request & { rcpUserId?: string };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// `Authorization: Bearer <RCP_SECRET>` proves the caller is Persona (it sends
// the RCP source's secret on every call, per the manifest's header auth).
// Only then is X-SS-User-Id trusted: it carries the Clerk user id Persona
// mapped into the tool's `userId` param for this chat.
@Injectable()
export class RcpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RcpRequest>();

    const rcpSecret = process.env.RCP_SECRET;
    if (!rcpSecret) throw new ServiceUnavailableException('RCP is not configured on this server');

    const auth = request.headers.authorization ?? '';
    if (!safeEqual(auth, `Bearer ${rcpSecret}`)) throw new UnauthorizedException('Invalid RCP credential');

    const userId = request.header(RCP_USER_ID_HEADER)?.trim();
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
