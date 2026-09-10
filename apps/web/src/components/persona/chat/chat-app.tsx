"use client";

import * as React from "react";
import { useChat, useVoice, useThreads } from "@personaai/react";
import type {
  PersonaSubagentActivityEntry,
  PersonaWorkspaceFile,
} from "@personaai/react";
import {
  ChatScroller,
  ChatScrollerItem,
  ChatMessage,
  ChatComposer,
  ChatEmptyState,
  InterruptPanel,
  SubagentSheet,
  PresentedFileSheet,
  VoiceIndicator,
} from "@/components/persona/chat";
import { ChatHeader } from "@/components/persona/chat/chat-header";
import { ThreadSidebar } from "@/components/persona/chat/thread-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    error: threadsError,
    createThread,
    renameThread,
    deleteThread,
  } = useThreads(true);
  const [threadId, setThreadId] = React.useState<string | null>(null);

  // Deliberately NO auto-select on load. There used to be a rule here that
  // grabbed threads[0] whenever nothing was selected. threads[0] is the
  // newest thread, and the newest thread is very often an empty one left
  // behind by a previous send or "New chat" — so every page load fired a
  // history fetch for a thread the user never asked for and then landed on
  // "How can I help?" even when real conversations existed. It also silently
  // pointed the composer at an existing thread, so a stray send went into
  // someone's old conversation instead of a new one. Opening a fresh chat is
  // the correct landing state; `ensureThreadId` below creates a real thread
  // on the first send, which is what the old rule was there to guarantee.

  const voice = useVoice({ agentId: AGENT_ID, threadId: threadId ?? undefined });
  const chat = useChat({ agentId: AGENT_ID, threadId: threadId ?? undefined, voice });

  const isVoiceActive = voice.state !== "idle" && voice.state !== "ended";

  const [openSubagentToolCallId, setOpenSubagentToolCallId] = React.useState<string | null>(null);

  // Which workspace file the preview sheet is showing, or null when closed.
  //
  // Caller-owned on purpose — NOT `chat.presentedFile`. The SDK sets that
  // itself the moment a `present_file` call returns (dist/index.js:822), so
  // binding the sheet to it flung the preview open under the user as a side
  // effect of the agent finishing a tool call. Opening a file is the user's
  // choice, made by clicking Open on the tool card; this state is that click.
  const [openFilePath, setOpenFilePath] = React.useState<string | null>(null);

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

  // What the preview sheet resolves against. `chat.files` (the STATE_SNAPSHOT)
  // is the primary source; on top of it we fold in any content a `present_file`
  // call returned, because that envelope carries the file the agent actually
  // meant and is the one path the snapshot is most likely to key differently.
  // Guarded on both fields being strings, so an envelope that carries no
  // content (or no JSON at all) simply contributes nothing.
  const previewFiles = React.useMemo(() => {
    const files: Record<string, PersonaWorkspaceFile> = { ...chat.files };
    for (const message of chat.messages) {
      for (const toolCall of message.toolCalls ?? []) {
        if (toolCall.toolName !== "present_file" || toolCall.isError) continue;
        if (!toolCall.result) continue;
        try {
          const parsed = JSON.parse(toolCall.result) as {
            filePath?: unknown;
            content?: unknown;
          };
          if (
            typeof parsed.filePath !== "string" ||
            typeof parsed.content !== "string" ||
            files[parsed.filePath]?.content != null
          ) {
            continue;
          }
          files[parsed.filePath] = {
            content: parsed.content,
            size: parsed.content.length,
            createdAt: null,
            modifiedAt: null,
          };
        } catch {
          // Not a JSON envelope — nothing to harvest from it.
        }
      }
    }
    return files;
  }, [chat.files, chat.messages]);

  const activeThreadTitle = React.useMemo(
    () => threads.find((t) => t._id === threadId)?.title,
    [threads, threadId]
  );

  // One loader, not two. useChat already auto-loads a thread's history whenever
  // `threadId` changes to one it hasn't loaded and `messages` is empty (its own
  // auto-load effect). Calling loadThreadMessages ourselves on top of that left
  // TWO fetches in flight for different threads with no ordering guarantee — the
  // stale one resolved last and overwrote the thread the user actually clicked,
  // which is what "can't load existing messages" was. Clearing the messages and
  // setting the id in the SAME tick lets React batch them into a single render,
  // so the SDK's effect sees an empty list and exactly one id to fetch.
  const switchToThread = React.useCallback(
    (id: string) => {
      if (id === threadId) return;
      chat.setMessages([]);
      setThreadId(id);
    },
    [chat, threadId]
  );

  const handleNewChat = React.useCallback(async () => {
    const thread = await createThread(AGENT_ID);
    chat.setMessages([]);
    setThreadId(thread._id);
  }, [createThread, chat]);

  // Deleting the open thread would otherwise leave threadId pointing at a
  // record the server no longer has. Clearing it hands off to the
  // keep-a-thread-selected rule above, which picks the next newest one.
  const handleDeleteThread = React.useCallback(
    (id: string) => {
      void deleteThread(id);
      if (id !== threadId) return;
      chat.setMessages([]);
      setThreadId(null);
    },
    [deleteThread, threadId, chat]
  );

  // Sending with no thread selected (the very first message of a fresh
  // conversation) used to fire chat.sendMessage() with threadId: null — the
  // reply streamed in and looked fine, but nothing was ever attached to a
  // real, listed thread, so it vanished on reload. sendMessage's own
  // overrideOptions.threadId accepts a Promise for exactly this case (its
  // optimistic UI update runs immediately; it only awaits the promise right
  // before the actual request) — lazily create the thread and hand that
  // promise straight to sendMessage instead of pre-awaiting it ourselves.
  const ensureThreadId = React.useCallback((): string | Promise<string> => {
    if (threadId) return threadId;
    return createThread(AGENT_ID).then((thread) => {
      setThreadId(thread._id);
      return thread._id;
    });
  }, [threadId, createThread]);

  // Refuse to send while a history fetch is in flight. The SDK's
  // loadThreadMessages ends with an ABSOLUTE setMessages(loaded) (not a
  // functional update), so a fetch that started before the send resolves
  // after it and replaces the optimistic user message + assistant
  // placeholder with the stored history. The stream then keeps writing into
  // a message id that is no longer in the list, and the sent message never
  // appears. Waiting the fetch out removes the overlap entirely; the input
  // text is untouched, so nothing the user typed is lost.
  const handleSend = React.useCallback(
    (text?: string) => {
      if (chat.isLoadingHistory) return;
      void chat.sendMessage(text, { threadId: ensureThreadId() });
    },
    [chat, ensureThreadId]
  );

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
    // SidebarProvider is what makes the thread list mobile-capable: it renders
    // a fixed panel with a gap on desktop and a dismissible Sheet on mobile,
    // and hands both the trigger in the header and the sidebar itself the same
    // context. `min-h-0` overrides its own `min-h-svh` default so the app is
    // bounded by the body's h-dvh instead of a second, taller viewport unit.
    <SidebarProvider className="flex min-h-0 flex-1">
      <ThreadSidebar
        threads={threads}
        activeThreadId={threadId}
        isLoading={threadsLoading}
        error={threadsError}
        onSelectThread={switchToThread}
        onCreateThread={handleNewChat}
        onRenameThread={renameThread}
        onDeleteThread={handleDeleteThread}
      />

      <SidebarInset className="flex min-h-0 flex-col">
        <ChatHeader threadTitle={activeThreadTitle} onNewChat={handleNewChat} />

        {/* `&& grouped.length === 0`, not a bare isLoadingHistory: a history
            fetch used to blank the conversation while it was in flight, so a
            message sent during one vanished from the screen until the fetch
            resolved (and the fetch could have started before the send, from a
            previous thread click). Only show the placeholder when there is
            genuinely nothing to show yet. */}
        {chat.isLoadingHistory && grouped.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading chat…
          </div>
        ) : grouped.length === 0 ? (
          <ChatEmptyState title="How can I help?" />
        ) : (
          <ChatScroller>
            {grouped.map(({ message, blocks }) => (
              // messageId registers the element with the scroller so it can
              // track what's visible, hold a scroll anchor across prepends,
              // and resolve scrollToMessage. The primitive skips any item
              // without it.
              <ChatScrollerItem key={message.id} messageId={message.id}>
                <ChatMessage
                  message={message}
                  blocks={blocks}
                  todos={chat.todos}
                  onOpenSubagent={setOpenSubagentToolCallId}
                  // The Open button on a present_file card. Hands the path to
                  // the sheet; nothing opens on its own.
                  onOpenWorkspaceFile={setOpenFilePath}
                  onSendMessage={(text) => handleSend(text)}
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

        {/* A failed history fetch leaves `messages` empty and only sets
            `error` — so an unauthenticated or errored load rendered as a
            silent "How can I help?" on a thread that really does have
            messages. Surface it instead of letting it read as an empty chat. */}
        {chat.error ? (
          <div className="px-4 pb-2 text-center text-xs text-destructive">
            {chat.error.message}
          </div>
        ) : null}

        {isVoiceActive && (
          // Voice mode's whole surface is the orb — a live call has no
          // transcript panel here, so it renders at its own size rather than
          // as a badge beside the composer.
          <div className="flex justify-center py-4">
            <VoiceIndicator state={voice.state} />
          </div>
        )}

        <div className="border-t border-border p-3">
          <div className="mx-auto w-full max-w-3xl">
            <ChatComposer
              value={chat.input}
              onChange={chat.setInput}
              onSend={() => handleSend()}
              onStop={chat.stop}
              onStartVoice={() => voice.start()}
              onStopVoice={voice.stop}
              onSendToVoice={voice.sendText}
              isStreaming={chat.isStreaming}
              isVoiceActive={isVoiceActive}
            />
          </div>
        </div>
      </SidebarInset>

      <SubagentSheet
        open={openSubagentToolCallId !== null}
        onOpenChange={(open) => !open && setOpenSubagentToolCallId(null)}
        activity={activeSubagentActivity}
      />

      <PresentedFileSheet
        path={openFilePath}
        files={previewFiles}
        onOpenChange={(open) => !open && setOpenFilePath(null)}
      />
    </SidebarProvider>
  );
}

export { ChatApp };
