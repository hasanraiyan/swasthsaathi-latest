import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';

// PersonaMiddleware is bound during NestFactory.create()
export async function resolveUserFrom(req: Request): Promise<string | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  try {
    const { sub } = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return sub;
  } catch {
    return null;
  }
}
