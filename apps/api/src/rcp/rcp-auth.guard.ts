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
import { RCP_USER_TOKEN_HEADER, verifyRcpUserToken } from './rcp-user-token.js';

type RcpRequest = Request & { rcpUserId?: string };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Two independent checks, both required:
//   1. `Authorization: Bearer <RCP_SECRET>` — proves the caller is the RCP
//      client we registered (Persona sends the source's secret on every call,
//      per the manifest's `auth: { type: 'header' }`).
//   2. `X-SS-User-Token` — proves which end user the call is for (see
//      rcp-user-token.ts). Never taken from the model: it's filled from the
//      chat turn's server-injected context.
@Injectable()
export class RcpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RcpRequest>();

    const rcpSecret = process.env.RCP_SECRET;
    if (!rcpSecret || !process.env.RCP_USER_TOKEN_SECRET) {
      throw new ServiceUnavailableException('RCP is not configured on this server');
    }

    const auth = request.headers.authorization ?? '';
    if (!safeEqual(auth, `Bearer ${rcpSecret}`)) throw new UnauthorizedException('Invalid RCP credential');

    const userId = verifyRcpUserToken(request.header(RCP_USER_TOKEN_HEADER));
    if (!userId) throw new UnauthorizedException('Missing or expired user token');

    request.rcpUserId = userId;
    return true;
  }
}

// Safe to assume non-null: every route using this sits behind RcpAuthGuard.
export const RcpUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<RcpRequest>().rcpUserId as string;
});
