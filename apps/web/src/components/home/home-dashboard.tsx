"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthGlanceTiles } from "@/components/home/health-glance-tiles";
import {
  ArrowUpIcon,
  ChartLineIcon,
  FileTextIcon,
  type Icon,
  PillIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@phosphor-icons/react";

const QUICK_ACTIONS: { label: string; icon: Icon; prompt: string }[] = [
  {
    label: "Understand a symptom",
    icon: ThermometerIcon,
    prompt: "I don't feel well. Can you help me understand what might be going on?",
  },
  {
    label: "My medicines",
    icon: PillIcon,
    prompt: "Can you help me review my medicines?",
  },
  {
    label: "My measurements",
    icon: ChartLineIcon,
    prompt: "Can you help me understand my recent health measurements?",
  },
  {
    label: "Explain a health report",
    icon: FileTextIcon,
    prompt: "I have a health report I'd like help understanding.",
  },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function promptHref(prompt: string): string {
  return `/chat?prompt=${encodeURIComponent(prompt)}`;
}

// The landing state. Chat lives at /chat as its own focused surface — a quick
// action or the "ask anything" bar hands off into it via ?prompt=..., which
// ChatApp picks up once to seed the composer (never auto-sent, just filled
// in for the user to review/edit).
function HomeDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [draft, setDraft] = React.useState("");
  const firstName = user?.firstName ?? "there";

  function handleAskSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    router.push(trimmed ? promptHref(trimmed) : "/chat");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your health.</p>
      </div>

      <HealthGlanceTiles />

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SparkleIcon className="text-primary" weight="fill" />
          Your health companion
        </div>
        <p className="text-sm text-muted-foreground">What would you like help with?</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ label, icon: ActionIcon, prompt }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 rounded-2xl py-2.5 text-left"
              render={<Link href={promptHref(prompt)} />}
            >
              <ActionIcon className="shrink-0 text-primary" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleAskSubmit}
        className="mt-auto flex items-center gap-3 rounded-full border border-border bg-card py-1.5 pr-1.5 pl-5 shadow-soft transition-colors focus-within:border-primary/40"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask SwasthyaSaathi anything..."
          className="h-auto flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon-sm"
          className="shrink-0 rounded-full"
          aria-label="Start conversation"
        >
          <ArrowUpIcon className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}

export { HomeDashboard };
