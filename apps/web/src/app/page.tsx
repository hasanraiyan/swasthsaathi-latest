import { Show, SignIn } from "@clerk/nextjs";
import { ChatApp } from "@/components/persona/chat/chat-app";

// Show is an async Server Component (Clerk Core 3 — SignedIn/SignedOut throw
// at runtime in this version), so the auth gate has to live here rather than
// in ChatApp itself, which needs "use client" for its hooks.
export default function Home() {
  return (
    <>
      <Show when="signed-out">
        {/* m-auto on the child rather than items-center/justify-center on the
            scroller: a flex-centred child taller than its container overflows
            above the scroll origin and can't be scrolled back into view. */}
        <div className="flex flex-1 overflow-y-auto">
          <div className="m-auto">
            <SignIn />
          </div>
        </div>
      </Show>
      <Show when="signed-in">
        <ChatApp />
      </Show>
    </>
  );
}
