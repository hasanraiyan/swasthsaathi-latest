"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import type { components } from "@swasthsaathi/sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { XIcon } from "@phosphor-icons/react";

type DoseSlot = components["schemas"]["DoseSlotDto"];
type DoseSlotStatus = DoseSlot["status"];

const STATUS_ACTIONS: { status: Exclude<DoseSlotStatus, "pending">; label: string }[] = [
  { status: "taken", label: "Taken" },
  { status: "skipped", label: "Skipped" },
  { status: "missed", label: "Missed" },
];

function slotKey(slot: Pick<DoseSlot, "medicationId" | "scheduledFor">) {
  return `${slot.medicationId}|${slot.scheduledFor}`;
}

function TodayMedicationSchedule() {
  const api = useApiClient();
  const [slots, setSlots] = React.useState<DoseSlot[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // "Dismiss" only hides a pending reminder from this session's view — there's
  // no reminder-delivery system (push/cron) yet for it to mean anything more
  // than that, so it isn't persisted and reappears on reload.
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/medications/doses/today");
      if (cancelled) return;
      if (fetchError) {
        setError("Couldn't load today's schedule.");
      } else {
        setSlots(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleRecord(slot: DoseSlot, status: Exclude<DoseSlotStatus, "pending">) {
    const key = slotKey(slot);
    setSavingKey(key);
    const { data, error: recordError } = await api.POST("/health/medications/doses", {
      body: { medicationId: slot.medicationId, scheduledFor: slot.scheduledFor, status },
    });
    setSavingKey(null);
    if (recordError || !data) return;
    setSlots((prev) => prev?.map((s) => (slotKey(s) === key ? { ...s, status } : s)) ?? null);
  }

  function handleDismiss(slot: DoseSlot) {
    setDismissed((prev) => new Set(prev).add(slotKey(slot)));
  }

  if (slots === null && !error) {
    return <Skeleton className="h-32 w-full" />;
  }

  const visible = slots?.filter((s) => !dismissed.has(slotKey(s))) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today</CardTitle>
        <CardDescription>Your medication schedule for today.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!error && visible.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {slots?.length ? "Nothing left to show — all set for today." : "No medications scheduled for today."}
          </p>
        )}
        {visible.map((slot) => {
          const key = slotKey(slot);
          return (
            <Item key={key} className="items-start border-b py-3 last:border-b-0">
              <ItemContent className="min-w-0 gap-1">
                <div className="text-xs text-muted-foreground">
                  {new Date(slot.scheduledFor).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
                <ItemTitle>
                  {slot.medicationName} · {slot.dosage}
                </ItemTitle>
              </ItemContent>
              <ItemActions className="flex-wrap justify-end gap-1.5">
                {STATUS_ACTIONS.map(({ status, label }) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={slot.status === status ? "default" : "outline"}
                    disabled={savingKey === key}
                    onClick={() => handleRecord(slot, status)}
                  >
                    {label}
                  </Button>
                ))}
                {slot.status === "pending" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Dismiss"
                    onClick={() => handleDismiss(slot)}
                  >
                    <XIcon />
                  </Button>
                )}
              </ItemActions>
            </Item>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { TodayMedicationSchedule };
