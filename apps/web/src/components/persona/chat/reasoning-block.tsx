"use client";

import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageMarkdown } from "./message-markdown";
import { ThinkingIndicator } from "./thinking-indicator";
import type { PersonaMessage } from "@personaai/react";

/**
 * One reasoning/thinking block, adapted from the old dashboard's
 * ReasoningBubble (itself from JimLiu/claude-agent-kit, MIT).
 *
 * A LIVE block renders the app's own ThinkingIndicator rather than a second,
 * hand-rolled spinner — one "thinking" affordance everywhere, with the
 * spinner and elapsed ticker it already owns. A FINISHED block collapses into
 * an italic "Thought" header (closed by default) so the final answer stays
 * the visual focus, and its thought text renders muted when opened.
 *
 * No left indent: this shares MessageContent with the assistant's answer, so
 * the old ml-1 border-l-2 pl-3 inset pushed the thinking text out of line with
 * the reply it belongs to.
 *
 * A finished block that captured nothing renders nothing — the old "No
 * reasoning captured." placeholder was a dead toggle with a scolding label.
 */
function ReasoningBlock({
  reasoning,
  className,
}: {
  reasoning: PersonaMessage;
  className?: string;
}) {
  const isStreaming = !!reasoning.isStreaming;
  // Derive open state from the live stream unless the user flips it manually;
  // manualOpen starts null so the first render follows the block's own state.
  const [manualOpen, setManualOpen] = React.useState<boolean | null>(null);
  const open = manualOpen ?? false;

  const hasContent = !!reasoning.content?.trim();

  if (isStreaming) {
    return (
      <div className={cn("max-w-full select-text", className)}>
        <ThinkingIndicator className="pl-0" />
        {hasContent ? (
          <MessageMarkdown muted content={reasoning.content} className="pl-0" />
        ) : null}
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setManualOpen}
      className={cn("max-w-full text-muted-foreground select-text", className)}
    >
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={open}
            className="group h-auto gap-1.5 rounded-sm px-0 py-0.5 text-xs font-medium italic opacity-80 hover:opacity-100"
          >
            <span className="font-medium tracking-tight">Thought</span>
            <CaretDownIcon
              className={cn("size-3 transition-transform", open && "rotate-180")}
            />
          </Button>
        }
      />
      <CollapsibleContent className="mt-1 pl-0">
        <MessageMarkdown muted content={reasoning.content} className="pl-0" />
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ReasoningBlock };
