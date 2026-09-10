import createClient from 'openapi-fetch';
import type { paths } from './generated/types.js';

export function createSdk(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export type Sdk = ReturnType<typeof createSdk>;
