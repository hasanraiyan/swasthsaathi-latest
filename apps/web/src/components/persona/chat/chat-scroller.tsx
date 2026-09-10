"use client";

import * as React from "react";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerViewport,
  MessageScrollerButton,
  MessageScrollerItem,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

/**
 * Auto-scrolling chat viewport — wraps the `MessageScroller*` primitive,
 * which already owns "stick to bottom while streaming" + "show a jump-to-
 * latest button once the user scrolls away" behavior. Replaces what
 * NotebookChat.js (the reference) hand-rolled with scrollContainerRef/
 * scrollAnchorRef + a manual IntersectionObserver-less effect.
 */
function ChatScroller({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MessageScroller>) {
  return (
    // autoScroll is opt-in and defaults to false — the primitive ships with
    // "stick to bottom" machinery wired up but switched off, so without this
    // a reply streams in below the fold and the view just sits where it was.
    // defaultScrollPosition already defaults to "end", so opening a thread
    // lands at the newest message rather than the top.
    <MessageScrollerProvider autoScroll>
      <MessageScroller className={cn("flex-1", className)} {...props}>
        <MessageScrollerViewport>
          <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-6">
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

// Re-exported so callers wrap each message in one of these (enables
// content-visibility:auto per item) without a second import from ui/.
export { ChatScroller, MessageScrollerItem as ChatScrollerItem };
