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

// Every tool sends this, filled by Persona from its reserved
// `{{externalUserId}}` token — see rcp-tools.ts.
export const RCP_USER_ID_HEADER = 'x-ss-user-id';

type RcpRequest = Request & { rcpUserId?: string };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// `Authorization: Bearer <RCP_SECRET>` proves the caller is Persona (it sends
// the RCP source's secret on every call, per the manifest's header auth).
// Only then is X-SS-User-Id trusted: Persona fills it with the external user
// id our resolveUserFrom verified via Clerk, and the model can't set it —
// `{{externalUserId}}` is reserved and isn't a declared tool param.
@Injectable()
export class RcpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RcpRequest>();

    const rcpSecret = process.env.RCP_SECRET;
    if (!rcpSecret) throw new ServiceUnavailableException('RCP is not configured on this server');

    const auth = request.headers.authorization ?? '';
    if (!safeEqual(auth, `Bearer ${rcpSecret}`)) throw new UnauthorizedException('Invalid RCP credential');

    const userId = request.header(RCP_USER_ID_HEADER)?.trim();
    // An unresolved template (literal "{{externalUserId}}") means the call
    // wasn't made on behalf of a signed-in user — refuse rather than create
    // records under a placeholder id.
    if (!userId || userId.includes('{{')) throw new UnauthorizedException('Missing user identity');

    request.rcpUserId = userId;
    return true;
  }
}

// Safe to assume non-null: every route using this sits behind RcpAuthGuard.
export const RcpUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<RcpRequest>().rcpUserId as string;
});
