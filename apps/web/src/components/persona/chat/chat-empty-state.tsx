"use client";

import * as React from "react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface ChatStarterPrompt {
  label: string;
  icon: Icon;
  template: string;
}

// Pastel tile colours the starter prompts cycle through — same tint pairs the
// home section tiles use, so the dashboard reads as one palette.
const PROMPT_TINTS = [
  "bg-tint-rose text-tint-rose-foreground",
  "bg-tint-lavender text-tint-lavender-foreground",
  "bg-tint-peach text-tint-peach-foreground",
  "bg-tint-sky text-tint-sky-foreground",
];

/** Section title row — heading on the left, optional action on the right. */
function DashboardSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Blank-conversation state — a greeting, caller-supplied dashboard content,
 * then starter-prompt cards that prefill (not auto-send) the composer,
 * matching NotebookChat.js's STARTER_PROMPTS pattern, generalized (no
 * notebook/course wording baked in — the caller supplies its own prompts and
 * copy).
 *
 * Scrolls on its own (`min-h-0 overflow-y-auto`) so the composer below stays
 * pinned no matter how much dashboard content sits above it.
 */
function ChatEmptyState({
  title,
  description,
  starterPrompts,
  onSelectPrompt,
  headerAction,
  children,
}: {
  title: string;
  description?: string;
  starterPrompts?: ChatStarterPrompt[];
  onSelectPrompt?: (template: string) => void;
  /** Rendered to the right of the greeting (e.g. a notifications button). */
  headerAction?: React.ReactNode;
  // Caller-supplied content between the greeting and the starter prompts —
  // e.g. dashboard cards. Kept generic here on purpose; this component
  // doesn't know what a "Health Profile" is.
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-6 md:px-6 md:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-[1.75rem]">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {headerAction}
        </header>

        {children}

        {starterPrompts?.length ? (
          <DashboardSection title="Ask SwasthSaathi">
            <div className="grid gap-3 sm:grid-cols-2">
              {starterPrompts.map(({ label, icon: PromptIcon, template }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectPrompt?.(template)}
                  className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft-lg focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      PROMPT_TINTS[i % PROMPT_TINTS.length],
                    )}
                  >
                    <PromptIcon className="size-5" weight="duotone" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{template}</span>
                  </span>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </button>
              ))}
            </div>
          </DashboardSection>
        ) : null}
      </div>
    </div>
  );
}

export { ChatEmptyState, DashboardSection };
