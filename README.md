# SwasthSaathi

Turborepo monorepo.

- `apps/api` — NestJS API, Swagger/OpenAPI spec served at `/api-docs` (JSON at `/api-docs-json`).
- `apps/web` — Next.js app.
- `packages/sdk` — typed client generated from the API's OpenAPI spec (`openapi-typescript` + `openapi-fetch`).

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # set MONGODB_URI
```

## Develop

```bash
pnpm dev      # runs api + web together via turbo
```

## Regenerate the SDK

Whenever API routes/DTOs change:

```bash
pnpm generate:sdk
```

This runs `apps/api`'s `generate:openapi` (boots the Nest app with `SKIP_DB=true` and writes `apps/api/openapi.json`, no live Mongo needed), then `packages/sdk`'s `generate:sdk` (runs `openapi-typescript` against that file into `packages/sdk/src/generated/types.ts`).

Import the SDK from `apps/web` (or any package) via the `@swasthsaathi/sdk` workspace package:

```ts
import { createSdk } from "@swasthsaathi/sdk";

const api = createSdk(process.env.NEXT_PUBLIC_API_URL!);
const { data, error } = await api.GET("/some-path");
```
