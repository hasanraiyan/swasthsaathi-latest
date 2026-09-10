"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Item, ItemMedia, ItemContent, ItemTitle } from "@/components/ui/item";
import { WrenchIcon } from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageMarkdown } from "./message-markdown";
import { humanizeToolName } from "./tool-call-card";
import { RequestResponsePanel } from "./tool-cards/request-response-panel";
import type { PersonaSubagentActivityEntry } from "@personaai/react";

// A subagent's own timeline arrives as a flat activity log (PersonaToolCall's
// `subagentActivity`), not a nested list of PersonaMessages — so it's
// re-rendered as a log rather than replayed through ChatMessage. Consecutive
// "text" entries (streamed deltas) are merged into one paragraph; a
// "tool_start" opens a block that its matching "tool_result" (by toolName)
// closes — entries carry no id to pair by, so pairing is sequential/by-name.
type SubagentBlock =
  | { kind: "text"; text: string }
  | { kind: "tool"; toolName: string; args?: string; result?: string; isRunning: boolean };

function groupSubagentActivity(activity: PersonaSubagentActivityEntry[]): SubagentBlock[] {
  const blocks: SubagentBlock[] = [];
  const runningIndexByTool = new Map<string, number>();

  for (const entry of activity) {
    if (entry.kind === "text") {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "text") {
        last.text += entry.delta ?? "";
      } else {
        blocks.push({ kind: "text", text: entry.delta ?? "" });
      }
      continue;
    }

    const toolName = entry.toolName ?? "tool";
    if (entry.kind === "tool_start") {
      runningIndexByTool.set(toolName, blocks.length);
      blocks.push({ kind: "tool", toolName, args: entry.args, isRunning: true });
      continue;
    }

    // tool_result
    const runningIndex = runningIndexByTool.get(toolName);
    const running = runningIndex !== undefined ? blocks[runningIndex] : undefined;
    if (running?.kind === "tool") {
      running.result = entry.result;
      running.isRunning = false;
      runningIndexByTool.delete(toolName);
    } else {
      blocks.push({ kind: "tool", toolName, result: entry.result, isRunning: false });
    }
  }

  return blocks;
}

function SubagentActivityBlock({ block }: { block: SubagentBlock }) {
  if (block.kind === "text") {
    return <MessageMarkdown content={block.text} />;
  }

  return (
    <Item variant="outline" size="sm" className="flex-col items-stretch">
      <div className="flex items-center gap-2.5">
        <ItemMedia variant="icon">
          <WrenchIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {humanizeToolName(block.toolName)}
            {block.isRunning ? "…" : ""}
          </ItemTitle>
        </ItemContent>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <RequestResponsePanel label="Input" text={block.args} />
        <RequestResponsePanel label="Result" text={block.result} />
      </div>
    </Item>
  );
}

/**
 * Slide-over replaying one subagent (`task` tool call)'s own activity
 * timeline, same idea as NotebookChat.js's SubagentDialog. On mobile it
 * comes up as a bottom sheet instead of a side drawer — a right-edge
 * drawer at phone widths is basically a full-screen cover with nowhere
 * natural to swipe it away from.
 */
function SubagentSheet({
  open,
  onOpenChange,
  activity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: PersonaSubagentActivityEntry[];
}) {
  const isMobile = useIsMobile();
  const blocks = React.useMemo(() => groupSubagentActivity(activity), [activity]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full sm:max-w-lg data-[side=bottom]:min-h-[60%] data-[side=bottom]:max-h-[85vh]"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>Subagent</SheetTitle>
          <SheetDescription>
            A helper the agent delegated a step to — its own activity timeline.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            {blocks.map((block, i) => (
              <SubagentActivityBlock key={i} block={block} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { SubagentSheet };
