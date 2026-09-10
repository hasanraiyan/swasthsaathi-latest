import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getAuth } from '@clerk/express';
import type { Request } from 'express';

export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return getAuth(request);
});
