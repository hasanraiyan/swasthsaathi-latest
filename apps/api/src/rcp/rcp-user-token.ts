import { createHmac, timingSafeEqual } from 'node:crypto';

// A short-lived, server-signed assertion of "this RCP tool call is for user X".
//
// Why not just pass the Clerk user id through? Persona fills a tool's
// `userToken` param from the chat turn's `context` (via the RCP source's
// paramContextMap), and `context` is otherwise browser-supplied — a raw user
// id there would let anyone act as anyone. resolveUserFrom mints this token
// *after* verifying the Clerk session and overwrites whatever the browser
// sent, so the only way to get a valid one is to be signed in as that user.

// Voice sessions carry context once at connect, so this has to outlive a
// long call; chat re-mints it every turn anyway.
const TOKEN_TTL_SECONDS = 2 * 60 * 60;

export const RCP_CONTEXT_KEY = 'ssUserToken';
export const RCP_USER_TOKEN_HEADER = 'x-ss-user-token';

function secret(): string | null {
  return process.env.RCP_USER_TOKEN_SECRET || null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function mintRcpUserToken(userId: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  ).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function verifyRcpUserToken(token: string | undefined): string | null {
  const key = secret();
  if (!key || !token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof sub !== 'string' || typeof exp !== 'number') return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return sub;
  } catch {
    return null;
  }
}
