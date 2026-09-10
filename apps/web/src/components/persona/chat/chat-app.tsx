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
  ChatHistorySkeleton,
  InterruptPanel,
  SubagentSheet,
  PresentedFileSheet,
  VoiceIndicator,
} from "@/components/persona/chat";
import { ChatHeader } from "@/components/persona/chat/chat-header";
import { ThreadSidebar } from "@/components/persona/chat/thread-sidebar";
import { HealthSummaryCard } from "@/components/health/health-summary-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MicrophoneIcon, MicrophoneSlashIcon, PhoneXIcon } from "@phosphor-icons/react";
import { groupMessagesWithReasoning } from "@/lib/persona/group-messages";
import { buildWorkspace } from "@/lib/persona/workspace-replay";

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
    renameThread,
    deleteThread,
    refetch: refetchThreads,
  } = useThreads(true);
  const [threadId, setThreadId] = React.useState<string | undefined>(undefined);

  // Ephemeral new chat (0.8.0): threadId === undefined means no real thread
  // yet — no POST /threads, no history fetch, instant empty UI. First
  // sendMessage auto-mints via POST /threads inside useChat and fires
  // onThreadCreated so we can sync the sidebar.

  const [runError, setRunError] = React.useState<{
    code: string;
    message: string;
    retryable?: boolean;
    providerName?: string;
  } | null>(null);

  const voice = useVoice({ agentId: AGENT_ID, threadId: threadId ?? undefined });
  const chat = useChat({
    agentId: AGENT_ID,
    threadId: threadId ?? undefined,
    voice,
    onThreadCreated: React.useCallback(
      (newId: string) => {
        setThreadId(newId);
        void refetchThreads();
      },
      [refetchThreads],
    ),
    onEvent: React.useCallback((event: { type: string; code?: string; message?: string; retryable?: boolean; providerName?: string }) => {
      if (event.type === "RUN_ERROR") {
        setRunError({
          code: event.code ?? "INTERNAL_ERROR",
          message: event.message ?? "Something went wrong",
          retryable: event.retryable,
          providerName: event.providerName,
        });
      }
    }, []),
    onError: React.useCallback((err: Error) => {
      // Fallback for non-stream errors that surface via useChat.error — RUN_ERROR is handled via onEvent above.
      // We still surface it here so the alert shows even if event is missed.
      if (err.message.includes("temporarily overloaded") || err.message.includes("Service temporarily")) {
        setRunError({ code: "INTERNAL_ERROR", message: err.message, retryable: false, providerName: "Nvidia" });
      }
    }, []),
  });

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

  // What the preview sheet resolves against.
  //
  // Kept as replay from transcript + snapshot (lib/persona/workspace-replay.ts)
  // for agents that emit no STATE_SNAPSHOT — 0.8.0 now guards snapshot
  // missing fields (B2) and fixes voice merge (A1+A2), so plain chat.files
  // would work for snapshot-emitting agents, but replay is still the most
  // complete source and costs nothing.
  const workspace = React.useMemo(
    () => buildWorkspace(chat.messages, chat.files),
    [chat.messages, chat.files]
  );

  const effectiveThreadId = chat.currentThreadId ?? threadId;
  const activeThreadTitle = React.useMemo(
    () => threads.find((t) => t._id === effectiveThreadId)?.title,
    [threads, effectiveThreadId]
  );

  // Is a thread's history still on its way? The pane has to know, because
  // "no messages" is ambiguous: it means either "this thread is empty" (show
  // the blank-chat state) or "this thread's messages haven't arrived yet"
  // (show the skeleton). Getting that wrong is what made switching threads
  // feel stuck — the empty state painted "How can I help?" over a conversation
  // that was in flight, so a click looked like it had thrown the thread away.
  //
  // The SDK's own `isLoadingHistory` cannot answer it on the frame the switch
  // lands. `switchToThread` clears the messages and sets the id in one render,
  // and the fetch is started from a *passive* effect one render later
  // (dist/index.js:522-542, which sets the flag at :467) — so on that first
  // render "not loading" and "finished loading" are the same value, false.
  // Only a genuine true→false edge proves a load began and came back empty.
  const [historyPending, setHistoryPending] = React.useState(false);
  const sawHistoryLoadingRef = React.useRef(false);

  React.useEffect(() => {
    if (!historyPending) {
      sawHistoryLoadingRef.current = false;
      return;
    }
    // Content landed — done.
    if (chat.messages.length > 0) {
      setHistoryPending(false);
      return;
    }
    // A switch made while a reply is still streaming cannot produce a fetch at
    // all: the SDK's auto-load opens with `if (!threadId || isStreaming)
    // return;` (dist/index.js:523). The edge this waits for would therefore
    // never come and the skeleton would sit there for good — a worse failure
    // than the one being fixed, since it never resolves. Release instead and
    // let the empty state hold the pane until the stream ends, at which point
    // the SDK's own effect finally fires and the history arrives.
    if (chat.isStreaming) {
      setHistoryPending(false);
      return;
    }
    if (chat.isLoadingHistory) {
      sawHistoryLoadingRef.current = true;
      return;
    }
    // A load this switch started has since finished and found nothing, so the
    // thread really is empty (or the fetch failed, in which case `chat.error`
    // is rendered below the pane) and the empty state is the honest thing to
    // show.
    //
    // Deliberately NOT keyed on `chat.error`: a failure from a *previous*
    // thread is still in state when the next switch begins, and treating that
    // stale error as this switch settling would drop the skeleton for the
    // whole of the real load. The true→false edge above already covers the
    // failing case, so the error branch would only ever fire early.
    if (sawHistoryLoadingRef.current) setHistoryPending(false);
  }, [historyPending, chat.isLoadingHistory, chat.isStreaming, chat.messages.length]);

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
      setRunError(null);
      setThreadId(id);
      setHistoryPending(true);
      sawHistoryLoadingRef.current = false;
    },
    [chat, threadId]
  );

  const handleNewChat = React.useCallback(() => {
    chat.startNewChat();
    setRunError(null);
    setThreadId(undefined);
    setHistoryPending(false);
    sawHistoryLoadingRef.current = false;
  }, [chat]);

  // Deleting the open thread would otherwise leave threadId pointing at a
  // record the server no longer has. Clearing it hands off to the
  // keep-a-thread-selected rule above, which picks the next newest one.
  const handleDeleteThread = React.useCallback(
    (id: string) => {
      void deleteThread(id);
      if (id !== threadId) return;
      chat.startNewChat();
      setRunError(null);
      setThreadId(undefined);
      // The thread that was loading no longer exists, so nothing is coming
      // for it — leaving the flag set would strand the skeleton over the
      // empty state that should follow the delete.
      setHistoryPending(false);
    },
    [deleteThread, threadId, chat]
  );
  const handleSend = React.useCallback(
    (text?: string) => {
      if (chat.isLoadingHistory) return;
      setRunError(null);
      void chat.sendMessage(text);
    },
    [chat]
  );

  const handleRetry = React.useCallback(() => {
    const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");
    const text = lastUser?.content?.trim();
    if (!text) {
      setRunError(null);
      return;
    }
    setRunError(null);
    void chat.sendMessage(text);
  }, [chat]);

  // Every `start()` opens a brand-new mic track, but `isMuted` is never reset
  // by the SDK — so a mute left over from the previous call would leave the
  // button reading "muted" while the new microphone is actually live. `mute()`
  // only reaches for a stream if one exists, so clearing it before the track
  // does is safe.
  const handleStartVoice = React.useCallback(() => {
    voice.mute(false);
    voice.start();
  }, [voice]);

  // Typing during a call goes over the voice socket, which is a different
  // channel from `chat.input` — the SDK's `sendText` (dist/index.js:1781)
  // writes to the websocket and nothing else. So without this the composer
  // goes on showing the text the user just sent, which reads as "it didn't
  // send" and invites sending it a second time.
  //
  // Cleared only in the states where the send actually lands. "connecting" is
  // deliberately excluded: the SDK creates the socket *before* it opens and
  // only leaves "connecting" on the server's `voice_session_ready` message, so
  // `sendText` can bail silently there. Wiping the box in that window would
  // destroy text that was never delivered; text left in the box is
  // recoverable, text deleted is not.
  const handleSendToVoice = React.useCallback(
    (text: string) => {
      voice.sendText(text);
      if (
        voice.state === "listening" ||
        voice.state === "thinking" ||
        voice.state === "speaking"
      ) {
        chat.setInput("");
      }
    },
    [voice, chat]
  );

  const activeSubagentActivity: PersonaSubagentActivityEntry[] = React.useMemo(() => {
    if (!openSubagentToolCallId) return [];
    for (const m of chat.messages) {
      const tc = m.toolCalls?.find((t) => t.toolCallId === openSubagentToolCallId);
      if (tc) return tc.subagentActivity ?? [];
    }
    return [];
  }, [chat.messages, openSubagentToolCallId]);

  const handleDecideHitl = (actionIndex: number, decision: "approve" | "reject") => {    if (!chat.interrupt || chat.interrupt.kind !== "hitl") return;
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
        activeThreadId={effectiveThreadId ?? null}
        isLoading={threadsLoading}
        error={threadsError}
        onSelectThread={switchToThread}
        onCreateThread={handleNewChat}
        onRenameThread={renameThread}
        onDeleteThread={handleDeleteThread}
      />

      <SidebarInset className="flex min-h-0 flex-col">
        <ChatHeader threadTitle={activeThreadTitle} onNewChat={handleNewChat} />

        {/* Order matters here. `historyPending` is checked first so an empty
            message list reads as "still coming" rather than as "nothing here",
            which is what put the blank-chat state over a thread that was
            loading. Both are guarded on `grouped.length === 0` too, so the
            moment real messages land they win immediately — the flag can lag a
            render behind the fetch and must never paint over delivered
            content. */}
        {historyPending && grouped.length === 0 ? (
          <ChatHistorySkeleton />
        ) : grouped.length === 0 ? (
          <ChatEmptyState title="How can I help?">
            <HealthSummaryCard />
          </ChatEmptyState>
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

        {runError ? (
          <div className="px-4 pb-2">
            <Alert variant="destructive" className="flex flex-col gap-2">
              <div>
                <AlertTitle>
                  {runError.code === "INTERNAL_ERROR" && /overloaded/i.test(runError.message)
                    ? "Service temporarily overloaded"
                    : "Something went wrong"}
                </AlertTitle>
                <AlertDescription>
                  {/overloaded/i.test(runError.message)
                    ? `${runError.providerName ? runError.providerName + " is" : "The model is"} temporarily overloaded. Your message wasn't lost — retry in a few seconds.`
                    : runError.message}
                </AlertDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  Retry
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRunError(null)}>
                  Dismiss
                </Button>
              </div>
            </Alert>
          </div>
        ) : null}

        {/* A failed history fetch leaves `messages` empty and only sets
            `error` — so an unauthenticated or errored load rendered as a
            silent "How can I help?" on a thread that really does have
            messages. Surface it instead of letting it read as an empty chat. */}
        {chat.error && !runError ? (
          <div className="px-4 pb-2">
            <Alert variant="destructive">
              <AlertTitle>Failed to load</AlertTitle>
              <AlertDescription>{chat.error.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {isVoiceActive && (
          // Voice mode's whole surface is the orb — a live call has no
          // transcript panel here, so it renders at its own size rather than
          // as a badge beside the composer.
          //
          // The call controls sit directly under it rather than only in the
          // composer: mid-call the orb is what the user is looking at, while
          // the composer's row is at the far bottom of the window.
          <div className="flex flex-col items-center gap-4 py-4">
            <VoiceIndicator state={voice.state} />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon-lg"
                aria-label="End call"
                onClick={voice.stop}
              >
                <PhoneXIcon />
              </Button>
              <Button
                type="button"
                // Filled while muted, so the state reads at a glance rather
                // than only from which glyph is showing.
                variant={voice.isMuted ? "default" : "outline"}
                size="icon-lg"
                aria-label={voice.isMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={voice.isMuted}
                onClick={() => voice.mute(!voice.isMuted)}
              >
                {voice.isMuted ? <MicrophoneSlashIcon /> : <MicrophoneIcon />}
              </Button>
            </div>
          </div>
        )}

        <Separator />
        <div className="p-3">
          <div className="mx-auto w-full max-w-3xl">
            <ChatComposer
              value={chat.input}
              onChange={chat.setInput}
              onSend={() => handleSend()}
              onStop={chat.stop}
              onStartVoice={handleStartVoice}
              onSendToVoice={handleSendToVoice}
              isStreaming={chat.isStreaming}
              isVoiceActive={isVoiceActive}
              isLoadingHistory={chat.isLoadingHistory}
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
        workspace={workspace}
        onOpenChange={(open) => !open && setOpenFilePath(null)}
      />
    </SidebarProvider>
  );
}

export { ChatApp };
