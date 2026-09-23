"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/brand";

/**
 * App-wide chrome above the conversation.
 *
 * Two jobs, both of which were missing: it gives the app a persistent identity
 * (the chat column previously started straight into the message list with
 * nothing naming it), and it hosts the sidebar trigger — on a phone the
 * thread list is hidden behind a sheet with no way to open it at all, so the
 * trigger and the mobile-only "New chat" both have to live up here, outside
 * the sidebar they control.
 *
 * Not scroll-aware and not thread-scoped: this is chrome, so it stays put
 * while the conversation scrolls under it and does not change shape between an
 * empty chat and a long one.
 */
function ChatHeader({
  threadTitle,
  onNewChat,
  className,
}: {
  /** Shown next to the wordmark so the active conversation is identifiable —
   * on mobile this is the only place it can be seen, since the sidebar is
   * behind a sheet. */
  threadTitle?: string;
  onNewChat?: () => void;
  className?: string;
}) {
  return (
    <header
      className={
        "flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur " +
        // Desktop has nothing to show here until a conversation has a title
        // (brand + nav live in the sidebar), so the bar would be an empty
        // strip over the home dashboard.
        (threadTitle ? "" : "md:hidden ") +
        (className ?? "")
      }
    >
      <SidebarTrigger className="md:hidden" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* The wordmark is phone-only: on desktop the sidebar's brand lockup is
            always in view, so repeating it here is noise — the header just
            names the conversation. */}
        <BrandWordmark className="shrink-0 text-sm md:hidden" />
        {threadTitle ? (
          <>
            <span aria-hidden className="shrink-0 text-muted-foreground/50 md:hidden">
              /
            </span>
            {/* `min-w-0` as well as `truncate`: a flex item defaults to
                min-width:auto, so without it the span refuses to shrink below
                its text and the ellipsis never applies. */}
            <span className="min-w-0 truncate text-sm text-muted-foreground md:font-semibold md:text-foreground">
              {threadTitle}
            </span>
          </>
        ) : null}
      </div>

      {onNewChat ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          aria-label="New chat"
          onClick={onNewChat}
        >
          <PlusIcon />
        </Button>
      ) : null}
    </header>
  );
}

export { ChatHeader };
