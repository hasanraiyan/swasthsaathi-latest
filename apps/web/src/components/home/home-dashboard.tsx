"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, SparkleIcon, StethoscopeIcon, HeartIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/persona/chat/chat-empty-state";
import { HealthGlanceTiles } from "@/components/home/health-glance-tiles";
import { HEALTH_NAV_ITEMS } from "@/lib/health-nav";
import { cn } from "@/lib/utils";

const HERO_PROMPT = "I'd like a quick health check-in. Can you ask me a few questions about how I'm feeling today?";

/** Mint hero card — the one loud thing on the home screen. */
function HomeHero({ onAsk }: { onAsk?: (template: string) => void }) {
  return (
    <div className="bg-mint-wash relative overflow-hidden rounded-[1.75rem] p-6 md:p-7">
      {/* decorative art — layered circles with a stethoscope, echoing the
          brand's soft, rounded illustration style without shipping an image */}
      <div aria-hidden className="pointer-events-none absolute top-1/2 -right-6 hidden -translate-y-1/2 sm:block md:right-4">
        <div className="relative flex size-44 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-white/45" />
          <div className="absolute inset-5 rounded-full bg-white/70" />
          <div className="relative flex size-20 items-center justify-center rounded-[1.6rem] bg-primary text-primary-foreground shadow-primary">
            <StethoscopeIcon className="size-10" weight="duotone" />
          </div>
          <span className="absolute top-5 left-3 flex size-9 items-center justify-center rounded-full bg-white text-tint-rose-foreground shadow-soft">
            <HeartIcon className="size-4.5" weight="fill" />
          </span>
          <span className="absolute right-3 bottom-6 flex size-7 items-center justify-center rounded-full bg-white text-primary shadow-soft">
            <PlusIcon className="size-3.5" weight="bold" />
          </span>
        </div>
      </div>

      <div className="relative flex max-w-[22rem] flex-col items-start gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[0.7rem] font-semibold text-primary">
          <SparkleIcon weight="fill" className="size-3" /> Your AI health companion
        </span>
        <h2 className="text-xl leading-snug font-bold tracking-tight text-foreground md:text-2xl">
          Feeling unwell? Get clarity in minutes
        </h2>
        <p className="text-sm text-foreground/70">
          Describe your symptoms, ask about a medicine, or share a report — in plain language.
        </p>
        <Button size="lg" className="mt-3 h-10 gap-2 rounded-full px-5" onClick={() => onAsk?.(HERO_PROMPT)}>
          Start a check-in <ArrowRightIcon weight="bold" />
        </Button>
      </div>
    </div>
  );
}

/** Pastel icon tiles for each health section — the app's "category row". */
function HealthSectionTiles() {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
      {HEALTH_NAV_ITEMS.map(({ href, shortLabel, icon: SectionIcon, tint }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-2xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:-translate-y-0.5 group-hover:shadow-soft",
              tint,
            )}
          >
            <SectionIcon className="size-6" weight="duotone" />
          </span>
          <span className="text-xs font-medium text-foreground/80">{shortLabel}</span>
        </Link>
      ))}
    </div>
  );
}

function SeeAll({ href, children = "See all" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="text-xs font-semibold text-primary hover:underline">
      {children}
    </Link>
  );
}

/**
 * Home screen content, slotted into ChatEmptyState between the greeting and
 * the starter prompts.
 */
function HomeDashboard({ onAsk }: { onAsk?: (template: string) => void }) {
  return (
    <>
      <HomeHero onAsk={onAsk} />

      <DashboardSection title="Your health">
        <HealthSectionTiles />
      </DashboardSection>

      <DashboardSection title="At a glance" action={<SeeAll href="/health/profile">View profile</SeeAll>}>
        <HealthGlanceTiles />
      </DashboardSection>
    </>
  );
}

export { HomeDashboard };
