This is the working system we will follow for every feature:

**Backend (NestJS CLI) → SDK → Frontend (SDK + shadcn/ui)**

Always follow this sequence:

1. **Backend** — Build the backend first using the NestJS CLI.
2. **SDK** — Generate the SDK from the backend/API once the backend is complete.
3. **Frontend** — Implement the web frontend using the generated SDK.
4. **UI** — Use shadcn/ui components for the frontend wherever applicable.

Do not skip the backend or bypass the SDK when implementing the frontend.

This workflow should be followed consistently for every module and feature we build.
