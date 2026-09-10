"use client";

import * as React from "react";
import Link from "next/link";
import { useApiClient } from "@/hooks/use-api-client";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
};

function GlanceStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 px-4 first:pl-0 last:pr-0">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// "Health at a glance" — the one thing worth surfacing before the user says
// anything. Deliberately not its own bordered card per stat (that's the
// admin-dashboard look this is replacing) — one soft surface, divided.
function HealthGlanceTiles() {
  const api = useApiClient();
  const [profile, setProfile] = React.useState<Profile | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    api.GET("/health/profile").then(({ data, error }) => {
      if (cancelled) return;
      setProfile(error ? null : (data ?? null));
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (profile === undefined) {
    return <Skeleton className="h-16 w-full rounded-2xl" />;
  }

  const stats: { value: string; label: string }[] = [];
  if (profile?.heightCm) stats.push({ value: `${profile.heightCm} cm`, label: "Height" });
  if (profile?.weightKg) stats.push({ value: `${profile.weightKg} kg`, label: "Weight" });
  if (profile?.bloodGroup && profile.bloodGroup !== "unknown") {
    stats.push({ value: profile.bloodGroup, label: "Blood group" });
  }

  if (stats.length === 0) {
    return (
      <Link
        href="/health/profile"
        className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        Set up your health profile to see it here
        <span aria-hidden>→</span>
      </Link>
    );
  }

  return (
    <div className="flex divide-x divide-border rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft">
      {stats.map((stat) => (
        <GlanceStat key={stat.label} value={stat.value} label={stat.label} />
      ))}
    </div>
  );
}

export { HealthGlanceTiles };
