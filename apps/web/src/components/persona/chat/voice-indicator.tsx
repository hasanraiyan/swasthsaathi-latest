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
 * `--orb-ui-size` in preference to its numeric `size` prop — the bundle sizes
 * its root as `width: var(--orb-ui-size, ${size}px)`, so the variable wins.
 * The orb is therefore sized here and stays legible from a 360px phone up to a
 * desktop, where a fixed px value would either overflow or look lost.
 *
 * The `vh` term is the one that is not about width. Voice controls sit *under*
 * the orb and the composer sits under those, all inside one flex column, so a
 * 240px orb plus its buttons is ~320px of a viewport that a landscape phone
 * may only be 400px tall — leaving the message list squeezed to nothing. The
 * clamp only bites on viewports that short; anywhere with room, 240px still
 * wins, which is the intended size on every normal screen. */
const RESPONSIVE_SIZE = "min(62vw, 240px, 44vh)";

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
