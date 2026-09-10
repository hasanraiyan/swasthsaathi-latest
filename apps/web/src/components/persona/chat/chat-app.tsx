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
import { Button } from "@/components/ui/button";
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

  // The user's own voice turn is the one line the SDK can lose.
  //
  // `useChat`'s voice→chat merge (dist/index.js:544) advances its private
  // "already merged" pointer to `voice.transcript.length` whenever the voice
  // state is not active — and `stop()` sets that state to "idle" synchronously.
  // The last thing anyone does before hanging up is talk, so the final
  // utterance routinely lands in that window and is swallowed; the agent's
  // reply was merged earlier, mid-call, which is why only the *user's* line
  // goes missing. `voice.partial` is the only place that utterance still
  // exists, since `handleTranscript` never commits it to `transcript`.
  //
  // So mirror both sources and subtract what the chat already shows. The
  // subtraction is exact, not fuzzy: the SDK's merge writes precisely
  // `line.text.trim()` into the message it appends, so a trimmed match proves
  // the line landed and a non-match proves it didn't. Deriving the echo
  // instead of writing it into `chat.messages` is what makes this safe — it
  // cannot double a message, cannot fight the SDK's own state, and disappears
  // on its own the moment the real message arrives.
  const voiceUserEcho = React.useMemo(() => {
    const texts: string[] = [];
    for (const line of voice.transcript) {
      if (line.speaker !== "user") continue;
      const text = (line.text ?? "").trim();
      if (text && !texts.includes(text)) texts.push(text);
    }
    // What the user is saying right now, which has no transcript line yet.
    const speaking =
      voice.partial?.speaker === "user" ? (voice.partial.text ?? "").trim() : "";
    if (speaking && !texts.includes(speaking)) texts.push(speaking);

    return texts
      .filter(
        (text) =>
          !chat.messages.some(
            (m) => m.role === "user" && m.content.trim() === text
          )
      )
      .map((text, i) => ({
        id: `voice-echo-${i}`,
        message: {
          id: `voice-echo-${i}`,
          role: "user" as const,
          content: text,
          createdAt: new Date(),
        },
      }));
  }, [voice.transcript, voice.partial, chat.messages]);

  // What the preview sheet resolves against.
  //
  // NOT `chat.files` alone. That map is written from exactly two places in the
  // SDK — thread load and a live `STATE_SNAPSHOT` event — so for an agent that
  // emits no snapshot it stays `{}` forever, and every preview landed on the
  // empty state even for a file written seconds earlier. The transcript is the
  // source that is always there: `write_file` args carry the whole body,
  // `edit_file` carries the spans, `read_file` carries the result back. See
  // lib/persona/workspace-replay.ts.
  const workspace = React.useMemo(
    () => buildWorkspace(chat.messages, chat.files),
    [chat.messages, chat.files]
  );

  const activeThreadTitle = React.useMemo(
    () => threads.find((t) => t._id === threadId)?.title,
    [threads, threadId]
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
      setThreadId(id);
      setHistoryPending(true);
      sawHistoryLoadingRef.current = false;
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
      // The thread that was loading no longer exists, so nothing is coming
      // for it — leaving the flag set would strand the skeleton over the
      // empty state that should follow the delete.
      setHistoryPending(false);
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

        {/* Order matters here. `historyPending` is checked first so an empty
            message list reads as "still coming" rather than as "nothing here",
            which is what put the blank-chat state over a thread that was
            loading. Both are guarded on `grouped.length === 0` too, so the
            moment real messages land they win immediately — the flag can lag a
            render behind the fetch and must never paint over delivered
            content. */}
        {historyPending && grouped.length === 0 && voiceUserEcho.length === 0 ? (
          <ChatHistorySkeleton />
        ) : grouped.length === 0 && voiceUserEcho.length === 0 ? (
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

            {/* Voice utterances the SDK's merge never committed — see
                voiceUserEcho above. They render as ordinary user turns so a
                salvaged line is indistinguishable from a merged one. */}
            {voiceUserEcho.map(({ id, message }) => (
              <ChatScrollerItem key={id} messageId={id}>
                <ChatMessage message={message} />
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

        <div className="border-t border-border p-3">
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
