"use client";

import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { MessageMarkdown } from "./message-markdown";
import { ToolCallTrace } from "./tool-call-trace";
import { ReasoningBlock } from "./reasoning-block";
import { ThinkingIndicator } from "./thinking-indicator";
import { CopyButton } from "./copy-button";
import type { MessageBlock } from "@/lib/persona/group-messages";
import type { PersonaMessage, PersonaTodo } from "@personaai/react";

/**
 * Role-based dispatch: the user's own turn is bubbled (align="end"),
 * matching Claude's own layout where only the human side gets bubble
 * chrome; the assistant's turn renders as plain content plus its tool-call
 * trace, no bubble — same split NotebookChat.js's ChatMessage uses.
 *
 * An assistant turn renders its `blocks` in order rather than a fixed
 * reasoning-then-tools-then-answer stack, so a second reasoning phase that
 * follows a tool call appears *after* that call instead of being merged into
 * the same thought block as the first. See group-messages.ts for how the
 * ordering is derived.
 */
function ChatMessage({
  message,
  blocks,
  todos,
  projectId,
  onOpenSubagent,
  onOpenWorkspaceFile,
  onSendMessage,
}: {
  message: PersonaMessage;
  /** The turn's reasoning phases and tool calls, interleaved by stream order. */
  blocks?: MessageBlock[];
  todos?: PersonaTodo[];
  projectId?: string;
  onOpenSubagent?: (toolCallId: string) => void;
  onOpenWorkspaceFile?: (path: string) => void;
  onSendMessage?: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>{message.content}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const allBlocks = blocks ?? [];
  // The answer text is always the turn's last block (see buildBlocks), so it's
  // rendered in place at the end rather than inside the map below.
  const leadBlocks = allBlocks.filter((b) => b.kind !== "content");
  // A live reasoning block auto-opens with its own animated header, so the
  // standalone "Thinking" gap indicator below would read as a duplicate —
  // show it only when nothing reasoning-related is already indicating.
  const hasLiveReasoning = allBlocks.some(
    (b) => b.kind === "reasoning" && b.reasoning?.isStreaming
  );
  const isEmptyStreaming =
    !!message.isStreaming && !message.content?.trim() && !hasToolCalls;

  return (
    <Message align="start" className="group/chat-message">
      <MessageContent>
        {/* One column owns the spacing between a turn's blocks — reasoning,
            tool runs, and the answer all sit on the same rhythm, and a
            tool run that lands between two reasoning phases reads as a
            divider between them rather than a header above both. */}
        <div className="flex flex-col gap-2">
          {leadBlocks.map((block) =>
            block.kind === "reasoning" ? (
              <ReasoningBlock key={block.key} reasoning={block.reasoning!} />
            ) : (
              <ToolCallTrace
                key={block.key}
                toolCalls={block.toolCalls!}
                todos={todos}
                projectId={projectId}
                onOpenSubagent={onOpenSubagent}
                onOpenWorkspaceFile={onOpenWorkspaceFile}
                onSendMessage={onSendMessage}
              />
            )
          )}

          {isEmptyStreaming && !hasLiveReasoning ? (
            <ThinkingIndicator />
          ) : message.content?.trim() ? (
            <MessageMarkdown content={message.content || ""} />
          ) : null}

          {!message.isStreaming && message.content && (
            <div className="opacity-0 transition-opacity group-hover/chat-message:opacity-100">
              <CopyButton text={message.content} label="Copy message" />
            </div>
          )}
        </div>
      </MessageContent>
    </Message>
  );
}

export { ChatMessage };
