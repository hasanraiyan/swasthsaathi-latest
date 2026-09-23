import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { mintRcpUserToken, RCP_CONTEXT_KEY } from '../rcp/rcp-user-token.js';

// The two runtime routes that forward a per-turn `context` to Persona, which
// is where RCP tools read their `userToken` from (paramContextMap).
const CONTEXT_ROUTES = [/\/chat\/?$/, /\/voice\/sessions\/?$/];

// Stamps a freshly signed RCP user token into the request's `context`,
// overwriting anything the browser sent under that key — so tool calls can
// only ever act as the user whose Clerk session made this request.
//
// This relies on the adapter handing the runtime the same parsed `req.body`
// object (it does: `body = req.body ?? readJsonBody()`), and on
// resolveUserFrom running before runtime.handle() reads it. There's no
// adapter hook for server-side context injection, and a separate Nest
// middleware can't be ordered ahead of PersonaModule's (it's @Global, so
// its middleware registers first).
function injectRcpContext(req: Request, userId: string) {
  if (req.method !== 'POST') return;
  const path = (req.originalUrl ?? req.url).split('?')[0];
  if (!CONTEXT_ROUTES.some((pattern) => pattern.test(path))) return;
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return;

  const token = mintRcpUserToken(userId);
  if (!token) return; // RCP not configured — leave context untouched.

  const body = req.body as { context?: unknown };
  const existing =
    body.context && typeof body.context === 'object' && !Array.isArray(body.context)
      ? (body.context as Record<string, unknown>)
      : {};
  body.context = { ...existing, [RCP_CONTEXT_KEY]: token };
}

// PersonaMiddleware is bound during NestFactory.create()
export async function resolveUserFrom(req: Request): Promise<string | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  try {
    const { sub } = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    injectRcpContext(req, sub);
    return sub;
  } catch {
    return null;
  }
}
