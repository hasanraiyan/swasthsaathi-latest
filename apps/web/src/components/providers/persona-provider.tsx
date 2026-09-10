"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { PersonaProvider as PersonaSdkProvider } from "@personaai/react";

// apps/api runs on a separate origin from apps/web, so the SDK's requests to
// baseUrl need a bearer token on every call — resolveUserFrom on the NestJS
// side reads it back off the Authorization header (see apps/api/src/persona).
function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  return (
    <PersonaSdkProvider
      baseUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/persona`}
      getAuthToken={getToken}
      defaultAgentId={process.env.NEXT_PUBLIC_PERSONA_AGENT_ID}
    >
      {children}
    </PersonaSdkProvider>
  );
}

export { PersonaProvider };
