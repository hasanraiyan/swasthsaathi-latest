import { Show, SignIn } from "@clerk/nextjs";
import { ChatApp } from "@/components/persona/chat/chat-app";

// Show is an async Server Component (Clerk Core 3 — SignedIn/SignedOut throw
// at runtime in this version), so the auth gate has to live here rather than
// in ChatApp itself, which needs "use client" for its hooks.
export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex flex-1 items-center justify-center">
          <SignIn />
        </div>
      </Show>
      <Show when="signed-in">
        <ChatApp />
      </Show>
    </>
  );
}
