import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getAuth } from '@clerk/express';
import type { Request } from 'express';

// Safe to assume non-null: every route using this decorator sits behind ClerkAuthGuard.
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const { userId } = getAuth(request);
  return userId as string;
});
