import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getAuth } from '@clerk/express';
import type { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const { isAuthenticated } = getAuth(request);

    if (!isAuthenticated) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
