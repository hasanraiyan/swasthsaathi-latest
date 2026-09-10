import { Show, SignIn } from "@clerk/nextjs";
import { ChatApp } from "@/components/persona/chat/chat-app";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Show is an async Server Component (Clerk Core 3 — SignedIn/SignedOut throw
// at runtime in this version), so the auth gate has to live here rather than
// in ChatApp itself, which needs "use client" for its hooks.
//
// This is both the landing page and the chat surface — no separate "Home"
// route. ChatApp's own empty state (no active thread) doubles as the
// dashboard: greeting, health-at-a-glance, and starter prompts that seed the
// composer directly. Once a thread has messages, it's just chat.
export default function Home() {
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
        <ChatApp />
      </Show>
    </>
  );
}
