"use client";

import { Orb, type OrbState } from "orb-ui";
import { cn } from "@/lib/utils";
import type { PersonaVoiceState as VoiceCallState } from "@personaai/react";

// Orb's own state union has no "ended" — a finished call reads as idle.
function toOrbState(state: VoiceCallState): OrbState {
  return state === "ended" ? "idle" : state;
}

const STATE_LABELS: Record<VoiceCallState, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Speaking",
  ended: "Call ended",
  error: "Voice unavailable",
};

/** Tailwind's `size-*`/inline width can't express this, and Orb reads
 * `--orb-ui-size` in preference to its numeric `size` prop — so the orb is
 * sized by that variable and stays legible from a 360px phone up to a
 * desktop, where a fixed px value would either overflow or look lost. */
const RESPONSIVE_SIZE = "min(62vw, 240px)";

/**
 * The animated voice-state orb — same `orb-ui` package NotebookChat.js (the
 * reference) uses, controlled rather than adapter-driven since state/volume
 * already come from `useVoice()`.
 *
 * This is the *voice mode* presence, not an inline badge: a live call's whole
 * surface is this orb and its state, so it renders large (Orb's own default is
 * 200px; the 28px this used to default to read as a decorative dot next to the
 * transcript). Sizing is responsive because voice is started from the phone as
 * often as from a desktop.
 */
function VoiceIndicator({
  state,
  size,
  showLabel = true,
  className,
}: {
  state: VoiceCallState;
  /** Overrides the responsive default. Pass a number for a compact inline use. */
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const isPulsing = state === "listening" || state === "speaking";
  return (
    <div
      className={cn(
        "flex animate-in fade-in zoom-in-95 flex-col items-center justify-center gap-3 duration-300",
        className
      )}
    >
      <div className={cn("flex items-center justify-center", isPulsing && "animate-pulse")}>
        <Orb
          state={toOrbState(state)}
          theme="cloud"
          size={size}
          // Orb's own launch/stop controls stay off — session control lives in
          // the composer's voice buttons, so a second control surface here
          // would just be a second way to do the same thing.
          interactive={false}
          style={{ "--orb-ui-size": size != null ? `${size}px` : RESPONSIVE_SIZE }}
          aria-label={`Voice ${state}`}
        />
      </div>

      {showLabel ? (
        <span
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-muted-foreground"
        >
          {STATE_LABELS[state]}
        </span>
      ) : null}
    </div>
  );
}

export { VoiceIndicator };
