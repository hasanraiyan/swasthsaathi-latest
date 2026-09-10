"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { PersonaProvider as PersonaSdkProvider, type LogLevel } from "@personaai/react";

// Off by default in the SDK. NEXT_PUBLIC_PERSONA_LOG_LEVEL lets it be turned
// up (e.g. "debug") without a code change — prints the SDK's own request/auth
// diagnostics to the browser console.
const LOG_LEVEL = (process.env.NEXT_PUBLIC_PERSONA_LOG_LEVEL as LogLevel | undefined) ?? "warn";

// apps/api runs on a separate origin from apps/web, so the SDK's requests to
// baseUrl need a bearer token on every call — resolveUserFrom on the NestJS
// side reads it back off the Authorization header (see apps/api/src/persona).
function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  // Clerk's getToken isn't referentially stable across renders. The SDK's own
  // PersonaProvider keys its context value (and every hook built on it —
  // useChat/useThreads/useVoice) off this getAuthToken prop's identity, so an
  // unstable one was rebuilding that whole context on every render — visible
  // as "PersonaProvider created/mounted" logging dozens of times per load,
  // and the underlying cause of threads/messages never settling. A ref-backed
  // callback keeps the identity stable while still calling the latest getToken.
  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);
  const getAuthToken = React.useCallback(() => getTokenRef.current(), []);

  return (
    <PersonaSdkProvider
      baseUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/persona`}
      getAuthToken={getAuthToken}
      defaultAgentId={process.env.NEXT_PUBLIC_PERSONA_AGENT_ID}
      logLevel={LOG_LEVEL}
    >
      {children}
    </PersonaSdkProvider>
  );
}

export { PersonaProvider };
