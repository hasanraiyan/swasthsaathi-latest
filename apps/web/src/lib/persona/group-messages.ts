import type {
  PersonaMessage,
  PersonaToolCall,
} from "@personaai/react";

/**
 * One rendered piece of an assistant turn, in the order it actually streamed.
 *
 * A turn is not "some reasoning, then some tools, then an answer" — the agent
 * thinks, calls a tool, thinks again about the result, calls another tool, and
 * only then writes its reply. `seq` is what preserves that, because both
 * reasoning phases and tool calls are stamped from the same monotonic counter.
 */
export type MessageBlock =
  | { kind: "reasoning"; key: string; reasoning: PersonaMessage; seq: number | null }
  | { kind: "tools"; key: string; toolCalls: PersonaToolCall[]; seq: number | null }
  | { kind: "content"; key: string; seq: number | null };

export interface GroupedMessage {
  message: PersonaMessage;
  /** Every reasoning message this turn owns, in stream order. */
  reasoning: PersonaMessage[];
  /** The same content as `reasoning` + `message`, interleaved. */
  blocks: MessageBlock[];
}

/**
 * Interleave one assistant message's reasoning phases and tool calls.
 *
 * `useChat` does NOT give us a turn already interleaved: reasoning arrives as
 * its own `role: "reasoning"` messages, which the SDK splices in *immediately
 * before* the assistant message, while every tool call for the turn hangs off
 * that single assistant message. So the message array can only ever express
 * "all reasoning, then all tools" — which is precisely the clubbing bug: two
 * separate reasoning phases with a tool call between them came out as one
 * uninterrupted block of thought, because they were adjacent in the array and
 * separated only by `seq`.
 *
 * `seq` is the fix, and it is what the SDK documents it for. Every entry —
 * each reasoning phase, each tool call — sorts by it; the final answer text has
 * no `seq` of its own and always streams last, so it sorts to the end. Runs of
 * consecutive tool calls are then merged into a single block so they render as
 * one group rather than one card stack per call.
 *
 * `seq` is absent on anything loaded from history (per the SDK's own note), so
 * when it's missing we do NOT guess — we fall back to the flat array order,
 * which is the same "reasoning above tools" rendering as before. Interleaving
 * is an upgrade for live streams, never a scramble of stored ones.
 */
function buildBlocks(
  message: PersonaMessage,
  reasoning: PersonaMessage[]
): MessageBlock[] {
  const toolCalls = message.toolCalls ?? [];
  const hasContent = !!message.content?.trim();
  const contentBlock: MessageBlock = {
    kind: "content",
    key: `content-${message.id}`,
    seq: null,
  };

  const interleavable =
    reasoning.length + toolCalls.length > 0 &&
    reasoning.every((r) => r.seq != null) &&
    toolCalls.every((t) => t.seq != null);

  if (!interleavable) {
    const blocks: MessageBlock[] = reasoning.map((r) => ({
      kind: "reasoning" as const,
      key: r.id,
      reasoning: r,
      seq: null,
    }));
    if (toolCalls.length > 0) {
      blocks.push({
        kind: "tools",
        key: `tools-${message.id}`,
        toolCalls,
        seq: null,
      });
    }
    if (hasContent) blocks.push(contentBlock);
    return blocks;
  }

  // `order` breaks seq ties (and carries the original array position for
  // stability) so the sort can never reorder two entries the counter called
  // simultaneous. `isTool` discriminates the union so the merge loop below can
  // narrow each entry's block to its real variant.
  type ReasoningEntry = {
    seq: number;
    order: number;
    isTool: false;
    block: Extract<MessageBlock, { kind: "reasoning" }>;
  };
  type ToolEntry = {
    seq: number;
    order: number;
    isTool: true;
    block: Extract<MessageBlock, { kind: "tools" }>;
  };
  const entries: Array<ReasoningEntry | ToolEntry> = [
    ...reasoning.map((r, i): ReasoningEntry => ({
      seq: r.seq as number,
      order: i,
      isTool: false,
      block: {
        kind: "reasoning",
        key: r.id,
        reasoning: r,
        seq: r.seq as number,
      },
    })),
    ...toolCalls.map((tc, i): ToolEntry => ({
      seq: tc.seq as number,
      order: reasoning.length + i,
      isTool: true,
      block: {
        kind: "tools",
        key: `tool-${tc.toolCallId}`,
        toolCalls: [tc],
        seq: tc.seq as number,
      },
    })),
  ];
  entries.sort((a, b) => a.seq - b.seq || a.order - b.order);

  const blocks: MessageBlock[] = [];
  let run: PersonaToolCall[] = [];
  let runSeq = 0;

  const flushRun = () => {
    if (run.length === 0) return;
    blocks.push({
      kind: "tools",
      key: `tools-${run[0].toolCallId}`,
      toolCalls: run,
      seq: runSeq,
    });
    run = [];
  };

  for (const entry of entries) {
    if (entry.isTool) {
      if (run.length === 0) runSeq = entry.seq;
      // A tool entry always carries exactly one call — see the construction
      // above; flattening it back out here is what rebuilds the runs.
      run.push(entry.block.toolCalls[0]);
    } else {
      flushRun();
      blocks.push(entry.block);
    }
  }
  flushRun();

  if (hasContent) blocks.push(contentBlock);
  return blocks;
}

/**
 * Turn the flat `useChat()` message list into renderable turns.
 *
 * Reasoning messages belong to the assistant turn that follows them, so each
 * contiguous run of `role: "reasoning"` is attached to the next non-reasoning
 * message and then interleaved with that message's tool calls via `seq` (see
 * `buildBlocks`). ChatMessage renders the resulting blocks instead of digging
 * through the top-level list itself.
 */
export function groupMessagesWithReasoning(
  messages: PersonaMessage[]
): GroupedMessage[] {
  const grouped: GroupedMessage[] = [];
  let pendingReasoning: PersonaMessage[] = [];

  const flush = (message: PersonaMessage, reasoning: PersonaMessage[]) => {
    grouped.push({ message, reasoning, blocks: buildBlocks(message, reasoning) });
  };

  for (const message of messages) {
    if (message.role === "reasoning") {
      pendingReasoning.push(message);
      continue;
    }
    flush(message, pendingReasoning);
    pendingReasoning = [];
  }

  // Reasoning that arrived before the assistant message it precedes exists
  // yet (mid-stream) — surface it on a synthetic streaming placeholder
  // rather than dropping it until the real message shows up.
  if (pendingReasoning.length > 0) {
    const last = pendingReasoning[pendingReasoning.length - 1];
    flush(
      {
        id: `pending-${last.id}`,
        role: "assistant",
        content: "",
        createdAt: last.createdAt,
        isStreaming: true,
      },
      pendingReasoning
    );
  }

  return grouped;
}
