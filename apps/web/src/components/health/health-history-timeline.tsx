"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import type { components } from "@swasthsaathi/sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRingingIcon,
  ChartLineIcon,
  FileTextIcon,
  FirstAidKitIcon,
  type Icon,
  PillIcon,
} from "@phosphor-icons/react";

type HealthEvent = components["schemas"]["HealthEventDto"];
type HealthEventType = HealthEvent["type"];

const EVENT_ICON: Record<HealthEventType, Icon> = {
  condition_added: FirstAidKitIcon,
  condition_resolved: FirstAidKitIcon,
  condition_reactivated: FirstAidKitIcon,
  medication_started: PillIcon,
  medication_paused: PillIcon,
  medication_resumed: PillIcon,
  medication_stopped: PillIcon,
  dose_taken: PillIcon,
  dose_skipped: PillIcon,
  dose_missed: PillIcon,
  measurement_recorded: ChartLineIcon,
  reminder_completed: BellRingingIcon,
  report_uploaded: FileTextIcon,
};

function dayLabel(date: Date): string {
  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = startOfDay(date);

  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return day.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(events: HealthEvent[]): { label: string; events: HealthEvent[] }[] {
  const groups: { label: string; events: HealthEvent[] }[] = [];
  for (const event of events) {
    const label = dayLabel(new Date(event.occurredAt));
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }
  return groups;
}

function HealthHistoryTimeline() {
  const api = useApiClient();
  const [events, setEvents] = React.useState<HealthEvent[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/history");
      if (cancelled) return;
      if (fetchError) {
        setError("Couldn't load your health history.");
      } else {
        setEvents(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const groups = events ? groupByDay(events) : [];

  return (
    <div className="mx-auto w-full max-w-lg overflow-y-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Health History</CardTitle>
          <CardDescription>Everything the Health Companion has recorded, in order.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {events === null && !error && <Skeleton className="h-48 w-full" />}

          {events && events.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nothing recorded yet — actions across your Health Companion will show up here.
            </p>
          )}

          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <div className="text-xs font-medium text-muted-foreground">{group.label}</div>
              {group.events.map((event) => {
                const EventIcon = EVENT_ICON[event.type];
                return (
                  <div key={event._id} className="flex items-center gap-2 border-b py-1.5 last:border-b-0">
                    <EventIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs">{event.summary}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export { HealthHistoryTimeline };
