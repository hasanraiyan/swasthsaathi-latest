"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { createSdk, type Sdk } from "@swasthsaathi/sdk";

// Same stable-ref trick as PersonaProvider (see components/providers/persona-provider.tsx):
// Clerk's getToken identity changes every render, but the client should only be built once.
// The middleware registration (and the ref read inside it) happens in an effect, not in the
// useMemo body — react-hooks/refs flags a ref-closing function handed to any external call
// during render, since it can't prove the call won't invoke it synchronously.
export function useApiClient(): Sdk {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const client = React.useMemo(() => createSdk(process.env.NEXT_PUBLIC_API_URL!), []);

  React.useEffect(() => {
    const authMiddleware = {
      onRequest: async ({ request }: { request: Request }) => {
        const token = await getTokenRef.current();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    };
    client.use(authMiddleware);
    return () => client.eject(authMiddleware);
  }, [client]);

  return client;
}
