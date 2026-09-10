"use client";

import * as React from "react";
import Link from "next/link";
import { useApiClient } from "@/hooks/use-api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartbeatIcon } from "@phosphor-icons/react";

type Profile = {
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
  allergies?: string[];
};

// Sits above the chat empty state ("How can I help?") as the app's dashboard
// surface — the one bit of Health Companion state worth surfacing before the
// user says anything. Grows as more Phase 1 modules (medications, reminders,
// ...) land; for now there's only a profile to show.
function HealthSummaryCard() {
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
    return <Skeleton className="mx-auto h-24 w-full max-w-md" />;
  }

  const hasProfile = profile && (profile.heightCm || profile.weightKg || profile.bloodGroup);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <HeartbeatIcon /> Health Profile
        </CardTitle>
        {!hasProfile && <CardDescription>Set up your profile so your Health Companion knows the basics.</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasProfile ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile?.heightCm && <span>Height: {profile.heightCm} cm</span>}
            {profile?.weightKg && <span>Weight: {profile.weightKg} kg</span>}
            {profile?.bloodGroup && profile.bloodGroup !== "unknown" && (
              <span>Blood group: {profile.bloodGroup}</span>
            )}
            {profile?.allergies && profile.allergies.length > 0 && (
              <span>Allergies: {profile.allergies.join(", ")}</span>
            )}
          </div>
        ) : null}
        <Button variant="outline" size="sm" className="self-start" render={<Link href="/health/profile" />}>
          {hasProfile ? "View / edit profile" : "Set up profile"}
        </Button>
      </CardContent>
    </Card>
  );
}

export { HealthSummaryCard };
