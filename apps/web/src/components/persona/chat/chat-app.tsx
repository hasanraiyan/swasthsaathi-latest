"use client";

import * as React from "react";
import { useChat, useVoice, useThreads } from "@personaai/react";
import type { PersonaSubagentActivityEntry } from "@personaai/react";
import {
  ChatScroller,
  ChatScrollerItem,
  ChatMessage,
  ChatComposer,
  ChatEmptyState,
  InterruptPanel,
  SubagentSheet,
  VoiceIndicator,
} from "@/components/persona/chat";
import { ThreadSidebar } from "@/components/persona/chat/thread-sidebar";
import { Button } from "@/components/ui/button";
import { MicrophoneIcon } from "@phosphor-icons/react";
import { groupMessagesWithReasoning } from "@/lib/persona/group-messages";

const AGENT_ID = process.env.NEXT_PUBLIC_PERSONA_AGENT_ID;

// Only mounted once Clerk confirms a session (see app/page.tsx's <Show>) —
// useChat/useVoice/useThreads (and their Persona API calls, which need that
// session's bearer token) never fire while signed out, so there's no 401 to
// see in the first place.
function ChatApp() {
  const {
    threads,
    isLoading: threadsLoading,
    createThread,
    renameThread,
    deleteThread,
  } = useThreads(false);
  const [threadId, setThreadId] = React.useState<string | null>(null);

  const voice = useVoice({ agentId: AGENT_ID, threadId: threadId ?? undefined });
  const chat = useChat({ agentId: AGENT_ID, threadId: threadId ?? undefined, voice });

  const isVoiceActive = voice.state !== "idle" && voice.state !== "ended";

  const [openSubagentToolCallId, setOpenSubagentToolCallId] = React.useState<string | null>(null);

  // Reset accumulated per-action decisions whenever a new interrupt arrives —
  // adjusted during render (React's sanctioned pattern for this) rather than
  // via a useEffect, so there's no extra post-mount render.
  const [decisionsState, setDecisionsState] = React.useState<{
    interrupt: typeof chat.interrupt;
    decisions: Record<number, "approve" | "reject">;
  }>({ interrupt: null, decisions: {} });
  if (decisionsState.interrupt !== chat.interrupt) {
    setDecisionsState({ interrupt: chat.interrupt, decisions: {} });
  }
  const hitlDecisions = decisionsState.decisions;
  const setHitlDecisions = (decisions: Record<number, "approve" | "reject">) =>
    setDecisionsState({ interrupt: chat.interrupt, decisions });

  const grouped = React.useMemo(
    () => groupMessagesWithReasoning(chat.messages),
    [chat.messages]
  );

  // Clear before load, not after — avoids a StrictMode double-invoke race
  // that would otherwise interleave stale and freshly-loaded messages.
  const switchToThread = React.useCallback(
    async (id: string) => {
      chat.setMessages([]);
      await chat.loadThreadMessages(id);
      setThreadId(id);
    },
    [chat]
  );

  const handleNewChat = React.useCallback(async () => {
    const thread = await createThread(AGENT_ID);
    await switchToThread(thread._id);
  }, [createThread, switchToThread]);

  const activeSubagentActivity: PersonaSubagentActivityEntry[] = React.useMemo(() => {
    if (!openSubagentToolCallId) return [];
    for (const m of chat.messages) {
      const tc = m.toolCalls?.find((t) => t.toolCallId === openSubagentToolCallId);
      if (tc) return tc.subagentActivity ?? [];
    }
    return [];
  }, [chat.messages, openSubagentToolCallId]);

  const handleDecideHitl = (actionIndex: number, decision: "approve" | "reject") => {
    if (!chat.interrupt || chat.interrupt.kind !== "hitl") return;
    const next = { ...hitlDecisions, [actionIndex]: decision };
    setHitlDecisions(next);

    const total = chat.interrupt.actionRequests.length;
    if (Object.keys(next).length < total) return;

    const decisions = chat.interrupt.actionRequests.map((_, i) => ({ type: next[i] }));
    void chat.resumeInterrupt({ decisions }, decision === "approve" ? "Approved" : "Rejected");
    setHitlDecisions({});
  };

  const handleSubmitClarification = (answersById: Record<string, string>) => {
    if (!chat.interrupt || chat.interrupt.kind !== "clarification") return;
    const answers = chat.interrupt.questions.map((q) => answersById[q.id] ?? "");
    void chat.resumeInterrupt({ answers }, "Submitted");
  };

  return (
    <div className="flex flex-1 min-h-0">
      <ThreadSidebar
        threads={threads}
        activeThreadId={threadId}
        isLoading={threadsLoading}
        onSelectThread={switchToThread}
        onCreateThread={handleNewChat}
        onRenameThread={renameThread}
        onDeleteThread={deleteThread}
      />

      <div className="flex flex-1 flex-col min-h-0">
        {grouped.length === 0 ? (
          <ChatEmptyState title="How can I help?" />
        ) : (
          <ChatScroller>
            {grouped.map(({ message, reasoning }) => (
              <ChatScrollerItem key={message.id}>
                <ChatMessage
                  message={message}
                  reasoning={reasoning}
                  todos={chat.todos}
                  onOpenSubagent={setOpenSubagentToolCallId}
                  onOpenWorkspaceFile={chat.openWorkspaceFile}
                  onSendMessage={(text) => chat.sendMessage(text)}
                />
              </ChatScrollerItem>
            ))}
          </ChatScroller>
        )}

        {chat.interrupt && (
          <div className="px-4 pb-2">
            <InterruptPanel
              interrupt={chat.interrupt}
              onSubmitClarification={handleSubmitClarification}
              onDecideHitl={handleDecideHitl}
            />
          </div>
        )}

        {isVoiceActive && (
          <div className="flex justify-center py-2">
            <VoiceIndicator state={voice.state} />
          </div>
        )}

        <div className="flex items-end gap-2 border-t border-border p-3">
          {!isVoiceActive && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Start voice"
              onClick={() => voice.start()}
            >
              <MicrophoneIcon />
            </Button>
          )}
          <div className="flex-1">
            <ChatComposer
              value={chat.input}
              onChange={chat.setInput}
              onSend={() => chat.sendMessage()}
              onStop={chat.stop}
              onStopVoice={voice.stop}
              onSendToVoice={voice.sendText}
              isStreaming={chat.isStreaming}
              isVoiceActive={isVoiceActive}
            />
          </div>
        </div>
      </div>

      <SubagentSheet
        open={openSubagentToolCallId !== null}
        onOpenChange={(open) => !open && setOpenSubagentToolCallId(null)}
        activity={activeSubagentActivity}
      />
    </div>
  );
}

export { ChatApp };
