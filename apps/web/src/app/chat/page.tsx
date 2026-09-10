import { Suspense } from "react";
import { Show, SignIn } from "@clerk/nextjs";
import { ChatApp } from "@/components/persona/chat/chat-app";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Show is an async Server Component (Clerk Core 3 — SignedIn/SignedOut throw
// at runtime in this version), so the auth gate has to live here rather than
// in ChatApp itself, which needs "use client" for its hooks.
//
// Suspense is required because ChatApp reads useSearchParams() (to pick up
// Home's ?prompt=... handoff) — Next.js bails a Client Component doing that
// out of static rendering unless it's wrapped.
export default function ChatPage() {
  return (
    <>
      <Show when="signed-out">
        <Empty className="flex-1">
          <EmptyContent>
            <SignIn />
          </EmptyContent>
        </Empty>
      </Show>
      <Show when="signed-in">
        <Suspense>
          <ChatApp />
        </Suspense>
      </Show>
    </>
  );
}
