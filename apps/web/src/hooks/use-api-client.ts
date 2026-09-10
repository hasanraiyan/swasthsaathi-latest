"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { createSdk, type Sdk } from "@swasthsaathi/sdk";

// Same stable-ref trick as PersonaProvider (see components/providers/persona-provider.tsx):
// Clerk's getToken identity changes every render, but the client should only be built once.
export function useApiClient(): Sdk {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const client = React.useMemo(() => {
    const sdk = createSdk(process.env.NEXT_PUBLIC_API_URL!);
    sdk.use({
      onRequest: async ({ request }) => {
        const token = await getTokenRef.current();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    });
    return sdk;
  }, []);

  return client;
}
