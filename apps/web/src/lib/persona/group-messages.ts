import type { PersonaMessage } from "@personaai/react";

export interface GroupedMessage {
  message: PersonaMessage;
  reasoning: PersonaMessage[];
}

/**
 * useChat() streams reasoning as separate role:"reasoning" messages, ordered
 * via `seq` alongside the message they precede — not embedded on the
 * assistant message. Groups each contiguous run of reasoning messages onto
 * the next non-reasoning message; ChatMessage renders them via its own
 * `reasoning` prop instead of finding them in the top-level list.
 */
export function groupMessagesWithReasoning(
  messages: PersonaMessage[]
): GroupedMessage[] {
  const grouped: GroupedMessage[] = [];
  let pendingReasoning: PersonaMessage[] = [];

  for (const message of messages) {
    if (message.role === "reasoning") {
      pendingReasoning.push(message);
      continue;
    }
    grouped.push({ message, reasoning: pendingReasoning });
    pendingReasoning = [];
  }

  // Reasoning that arrived before the assistant message it precedes exists
  // yet (mid-stream) — surface it on a synthetic streaming placeholder
  // rather than dropping it until the real message shows up.
  if (pendingReasoning.length > 0) {
    const last = pendingReasoning[pendingReasoning.length - 1];
    grouped.push({
      message: {
        id: `pending-${last.id}`,
        role: "assistant",
        content: "",
        createdAt: last.createdAt,
        isStreaming: true,
      },
      reasoning: pendingReasoning,
    });
  }

  return grouped;
}
