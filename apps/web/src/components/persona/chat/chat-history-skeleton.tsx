"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * What the pane shows between clicking a thread and its history arriving.
 *
 * It replaces a bare "Loading chat…" centered in an empty column, which read as
 * frozen: one static grey word with nothing moving is indistinguishable from a
 * pane that has given up. These are bars in the shape of a conversation
 * instead — right-aligned for the user's turns, wide left-aligned blocks for
 * the assistant's — so the first frame already resembles the thing that is
 * coming and the pulse has something to travel across.
 *
 * Deliberately not a centered spinner: a conversation has a shape, and showing
 * that shape is what makes the wait legible as loading rather than as blank.
 *
 * The frame (`max-w-3xl px-4 py-6`) is copied from ChatScroller's content
 * wrapper on purpose — matching it is what keeps the column from jumping
 * sideways at the moment the real messages take over.
 */
const ROWS = [
  { end: true, width: "w-2/5", height: "h-9" },
  { end: false, width: "w-3/4", height: "h-20" },
  { end: true, width: "w-1/2", height: "h-9" },
  { end: false, width: "w-5/6", height: "h-28" },
  { end: false, width: "w-2/3", height: "h-12" },
] as const;

function ChatHistorySkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-1 flex-col overflow-hidden", className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading conversation</span>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
        {ROWS.map((row, i) => (
          <div
            key={i}
            className={cn("flex", row.end ? "justify-end" : "justify-start")}
          >
            <Skeleton className={cn(row.width, row.height)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChatHistorySkeleton };
