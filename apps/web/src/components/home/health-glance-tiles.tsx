"use client";

import * as React from "react";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon, DropIcon, RulerIcon, ScalesIcon } from "@phosphor-icons/react";
import { useApiClient } from "@/hooks/use-api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Profile = {
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
};

type Stat = { value: string; unit?: string; label: string; icon: Icon; tint: string };

function GlanceStat({ value, unit, label, icon: StatIcon, tint }: Stat) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tint)}>
        <StatIcon className="size-5" weight="duotone" />
      </span>
      <div className="min-w-0">
        <div className="text-lg leading-tight font-bold tracking-tight">
          {value}
          {unit && <span className="ml-0.5 text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// "Health at a glance" — the one thing worth surfacing before the user says
// anything. One small card per stat, each with its own pastel icon tile so
// the numbers are scannable at a glance.
function HealthGlanceTiles() {
  const api = useApiClient();
  const [profile, setProfile] = React.useState<Profile | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    api
      .GET("/health/profile")
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfile(error ? null : (data ?? null));
      })
      // A network failure rejects rather than returning `error` — without
      // this the skeletons would shimmer forever.
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (profile === undefined) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-[70px] rounded-2xl" />
        <Skeleton className="h-[70px] rounded-2xl" />
        <Skeleton className="h-[70px] rounded-2xl" />
      </div>
    );
  }

  const stats: Stat[] = [];
  if (profile?.heightCm) {
    stats.push({
      value: String(profile.heightCm),
      unit: "cm",
      label: "Height",
      icon: RulerIcon,
      tint: "bg-tint-sky text-tint-sky-foreground",
    });
  }
  if (profile?.weightKg) {
    stats.push({
      value: String(profile.weightKg),
      unit: "kg",
      label: "Weight",
      icon: ScalesIcon,
      tint: "bg-tint-peach text-tint-peach-foreground",
    });
  }
  if (profile?.bloodGroup && profile.bloodGroup !== "unknown") {
    stats.push({
      value: profile.bloodGroup,
      label: "Blood group",
      icon: DropIcon,
      tint: "bg-tint-rose text-tint-rose-foreground",
    });
  }

  if (stats.length === 0) {
    return (
      <Link
        href="/health/profile"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/30 bg-tint-mint/50 px-4 py-4 text-sm transition-colors hover:bg-tint-mint"
      >
        <span>
          <span className="block font-semibold text-foreground">Complete your health profile</span>
          <span className="text-xs text-muted-foreground">Add height, weight and blood group to see them here.</span>
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
          <ArrowRightIcon className="size-4" weight="bold" />
        </span>
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <GlanceStat key={stat.label} {...stat} />
      ))}
    </div>
  );
}

export { HealthGlanceTiles };
