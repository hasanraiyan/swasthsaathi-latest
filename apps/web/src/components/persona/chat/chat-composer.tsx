"use client";

import * as React from "react";
import { ArrowUpIcon, SquareIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import { InputGroup, InputGroupTextarea, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";

// Same "start voice mode" glyph NotebookChat.js's ComposerForm uses (a
// waveform, not a generic microphone) — inlined to match it exactly rather
// than substituting a similar-but-different icon from phosphor's set.
// VoiceTab's "Start voice call" button renders this; the composer itself no
// longer shows a voice-mode toggle (nothing in the Playground wires it, so
// it was a dead button), so VoiceModeIcon lives here only as a shared glyph.
function VoiceModeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      {...props}
    >
      <path d="M2 10v3" />
      <path d="M6 6v11" />
      <path d="M10 3v18" />
      <path d="M14 8v8" />
      <path d="M18 5v14" />
      <path d="M22 10v3" />
    </svg>
  );
}

/**
 * Auto-resizing composer. The trailing action row is ALWAYS present, so the
 * composer keeps one steady height whether it is idle, streaming text, or
 * mid-voice-call — dropping the row when a surface has no voice button used
 * to shrink the idle composer into a short stub, so it is never conditionally
 * unmounted. Which action the row shows is computed by the caller:
 *
 *   loading history → spinner (the send is not available yet)
 *   streaming   → stop generating
 *   voice live  → send the typed text into the call
 *   idle, empty → start voice mode
 *   default     → send message (dimmed until there is text to send)
 *
 * Note that a live call has no end-call control here. It used to: a destructive
 * PhoneXIcon sat beside the send arrow, but everything the user is looking at
 * mid-call — the orb and its own controls — is several hundred pixels above
 * this row, so the hang-up button was at the far bottom of the window, away
 * from the thing it ends. Ending the call lives with the orb now (chat-app.tsx)
 * and this row is left with the one job it still needs: sending into the call.
 * That is why the voice branch has no bare `onStopVoice` to fall back on.
 *
 * The empty-state send is dimmed with `pointer-events-none` + reduced opacity
 * rather than a native `disabled` attribute — InputGroup greys out its WHOLE
 * contents via `has-disabled` when any child is disabled, which would wash
 * out the text field too.
 *
 * Soft Clinical — InputGroup is now curved (rounded-2xl) with soft
 * shadow via shadcn; no extra overrides needed. Buttons are pill/
 * rounded-full via InputGroupButton variants.
 */
function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  onStartVoice,
  onSendToVoice,
  isStreaming = false,
  isVoiceActive = false,
  isLoadingHistory = false,
  disabled = false,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  /** Idle + empty input renders this in the send button's own slot instead
   * of a dimmed send arrow — omit to keep the old always-a-send-arrow look. */
  onStartVoice?: () => void;
  onSendToVoice?: (text: string) => void;
  isStreaming?: boolean;
  isVoiceActive?: boolean;
  /** A thread's history is still being fetched. Sending is withheld until it
   * lands (the fetch's own `setMessages` is absolute and would wipe the
   * optimistic message), so the slot shows a spinner rather than a live send
   * button whose only behaviour would be to do nothing. */
  isLoadingHistory?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const trimmed = value.trim();

  const submit = () => {
    if (!trimmed || isLoadingHistory) return;
    if (isVoiceActive) {
      onSendToVoice?.(trimmed);
    } else if (!isStreaming) {
      onSend();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <InputGroup className="rounded-3xl bg-card px-1.5 py-1.5 shadow-soft-lg has-[textarea:focus-visible]:border-primary/40">
        <InputGroupTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // `isComposing` is what keeps Enter-to-send from sending a
            // half-finished word: while an IME candidate list is open (any
            // Devanagari, Urdu, or other composed script) Enter is how you
            // accept the candidate, and it arrives here looking exactly like a
            // submit. Committing the composition is the browser's job; only an
            // Enter that lands outside one is the user asking to send.
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            placeholder ?? (isVoiceActive ? "Type to voice…" : "Ask about symptoms, medicines, or reports…")
          }
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-11 px-3 text-sm md:text-sm"
        />

        <InputGroupAddon align="block-end" className="justify-end rounded-b-3xl px-2 pb-1.5 [&_[data-slot=button]]:size-8 [&_[data-slot=button]]:rounded-full">
          {isLoadingHistory ? (
            // `size-7` matches `size="icon-sm"` exactly, so the slot occupies
            // the same box and the row does not resize as the fetch settles.
            // A plain span, not a disabled button — there is nothing to press,
            // and a disabled control would grey the whole InputGroup out from
            // under the field the user is still typing into.
            <span
              className="flex size-7 items-center justify-center"
              role="status"
              aria-label="Loading conversation"
            >
              <Spinner className="size-4 text-muted-foreground" />
            </span>
          ) : isStreaming ? (
            <InputGroupButton
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label="Stop generating"
              onClick={onStop}
            >
              <SquareIcon weight="fill" />
            </InputGroupButton>
          ) : !isVoiceActive && !trimmed && onStartVoice ? (
            <InputGroupButton
              type="button"
              variant="default"
              size="icon-sm"
              aria-label="Use voice mode"
              onClick={onStartVoice}
            >
              <VoiceModeIcon className="size-4" />
            </InputGroupButton>
          ) : (
            // One send button for both modes. Typing during a call routes to
            // the call (see `submit`), so only the label differs — a second,
            // near-identical button for the voice case was just a way for the
            // two to drift apart.
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              aria-label={isVoiceActive ? "Send to voice" : "Send message"}
              // Dim but not natively disabled (see note above): pointer-events
              // off so an empty click no-ops and focuses the field instead.
              // Also what keeps the row from collapsing mid-call with nothing
              // typed — the slot is still occupied.
              className={trimmed ? undefined : "pointer-events-none opacity-40"}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export { ChatComposer, VoiceModeIcon };
