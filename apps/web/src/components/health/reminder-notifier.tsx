"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import type { components } from "@swasthsaathi/sdk";
import { useApiClient } from "@/hooks/use-api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BellRingingIcon, PillIcon, XIcon } from "@phosphor-icons/react";

type DoseSlot = components["schemas"]["DoseSlotDto"];
type Reminder = components["schemas"]["ReminderDto"];

// Fired after any dose/reminder change made from the tray, so on-page lists
// (today's schedule, reminders) can refetch instead of going stale.
export const HEALTH_DATA_CHANGED_EVENT = "ss:health-data-changed";

const REFETCH_MS = 5 * 60_000; // server data — changes rarely
const TICK_MS = 20_000; // re-evaluate "is it due yet" against cached data
// A pending dose stays "due" this long; after that the schedule page is
// where it gets marked missed — no point nagging about a 9am pill at 6pm.
const DOSE_DUE_WINDOW_MS = 3 * 60 * 60_000;
// Ignore long-forgotten one-off reminders rather than resurfacing them.
const REMINDER_MAX_AGE_MS = 7 * 24 * 60 * 60_000;
const SNOOZE_MINUTES = 10;

const SNOOZE_KEY = "ss:dose-snooze";
const NOTIFIED_KEY = "ss:notified";

type DueItem =
  | { kind: "dose"; key: string; dueAt: number; slot: DoseSlot }
  | { kind: "reminder"; key: string; dueAt: number; reminder: Reminder };

// localStorage can throw (private mode, blocked storage) — every read/write
// degrades to "nothing stored" rather than breaking the tray.
function readMap(name: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(name) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function writeMap(name: string, map: Record<string, number>) {
  const cutoff = Date.now() - 2 * 24 * 60 * 60_000;
  const pruned = Object.fromEntries(Object.entries(map).filter(([, t]) => t > cutoff));
  try {
    localStorage.setItem(name, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

function doseKey(slot: DoseSlot) {
  return `dose|${slot.medicationId}|${new Date(slot.scheduledFor).getTime()}`;
}

function reminderKey(reminder: Reminder) {
  return `reminder|${reminder._id}|${new Date(reminder.scheduledFor).getTime()}`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function computeDue(doses: DoseSlot[], reminders: Reminder[], now: number): DueItem[] {
  const snoozed = readMap(SNOOZE_KEY);
  const items: DueItem[] = [];

  for (const slot of doses) {
    if (slot.status !== "pending") continue;
    const dueAt = new Date(slot.scheduledFor).getTime();
    const key = doseKey(slot);
    if (dueAt > now || now - dueAt > DOSE_DUE_WINDOW_MS) continue;
    if ((snoozed[key] ?? 0) > now) continue;
    items.push({ kind: "dose", key, dueAt, slot });
  }

  for (const reminder of reminders) {
    if (reminder.status !== "pending") continue;
    const dueAt = new Date(reminder.scheduledFor).getTime();
    if (dueAt > now || now - dueAt > REMINDER_MAX_AGE_MS) continue;
    items.push({ kind: "reminder", key: reminderKey(reminder), dueAt, reminder });
  }

  return items.sort((a, b) => a.dueAt - b.dueAt);
}

// One browser notification per due occurrence (a snooze counts as a new
// occurrence once it expires). In-app tray items show regardless.
function notifyNew(items: DueItem[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const notified = readMap(NOTIFIED_KEY);
  const snoozed = readMap(SNOOZE_KEY);
  let changed = false;

  for (const item of items) {
    const occurrence = `${item.key}|${snoozed[item.key] ?? 0}`;
    if (notified[occurrence]) continue;
    notified[occurrence] = Date.now();
    changed = true;

    const [title, body] =
      item.kind === "dose"
        ? [`Time for ${item.slot.medicationName}`, `${item.slot.dosage} · due ${formatTime(item.dueAt)}`]
        : [item.reminder.title, item.reminder.notes || `Due ${formatTime(item.dueAt)}`];
    try {
      const notification = new Notification(title, { body, tag: item.key, icon: "/favicon.ico" });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Some platforms (Android Chrome) only allow notifications via a service worker.
    }
  }

  if (changed) writeMap(NOTIFIED_KEY, notified);
}

function DueItemCard({
  item,
  busy,
  onDose,
  onReminder,
  onSnooze,
}: {
  item: DueItem;
  busy: boolean;
  onDose: (slot: DoseSlot, status: "taken" | "skipped") => void;
  onReminder: (reminder: Reminder, action: "complete" | "snooze") => void;
  onSnooze: (item: DueItem) => void;
}) {
  const isDose = item.kind === "dose";
  const ItemIcon = isDose ? PillIcon : BellRingingIcon;

  return (
    <Card className="pointer-events-auto shadow-lg" size="sm">
      <CardContent className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ItemIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {isDose ? `${item.slot.medicationName} · ${item.slot.dosage}` : item.reminder.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {isDose ? "Medicine" : "Reminder"} due {formatTime(item.dueAt)}
            {!isDose && item.reminder.notes ? ` · ${item.reminder.notes}` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isDose ? (
              <>
                <Button size="sm" disabled={busy} onClick={() => onDose(item.slot, "taken")}>
                  Taken
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => onSnooze(item)}>
                  Snooze {SNOOZE_MINUTES}m
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDose(item.slot, "skipped")}>
                  Skip
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" disabled={busy} onClick={() => onReminder(item.reminder, "complete")}>
                  Done
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => onReminder(item.reminder, "snooze")}>
                  Snooze {SNOOZE_MINUTES}m
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderTray() {
  const api = useApiClient();
  const [doses, setDoses] = React.useState<DoseSlot[]>([]);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [now, setNow] = React.useState(() => Date.now());
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const [doseResult, reminderResult] = await Promise.all([
      api.GET("/health/medications/doses/today"),
      api.GET("/health/reminders"),
    ]);
    if (doseResult.data) setDoses(doseResult.data);
    if (reminderResult.data) setReminders(reminderResult.data);
    setNow(Date.now());
  }, [api]);

  React.useEffect(() => {
    // Initial load deferred a tick so it isn't a synchronous setState in the effect body.
    const initial = setTimeout(refetch, 0);
    const refetchTimer = setInterval(refetch, REFETCH_MS);
    const tickTimer = setInterval(() => setNow(Date.now()), TICK_MS);
    const onVisible = () => document.visibilityState === "visible" && refetch();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(HEALTH_DATA_CHANGED_EVENT, refetch);
    return () => {
      clearTimeout(initial);
      clearInterval(refetchTimer);
      clearInterval(tickTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(HEALTH_DATA_CHANGED_EVENT, refetch);
    };
  }, [refetch]);

  const due = React.useMemo(() => computeDue(doses, reminders, now), [doses, reminders, now]);

  React.useEffect(() => {
    notifyNew(due);
  }, [due]);

  const dueKeys = due.map((d) => d.key).join(",");
  const [lastSeenKeys, setLastSeenKeys] = React.useState(dueKeys);
  // A newly due item re-expands a collapsed tray (adjust-state-during-render,
  // not an effect, per React's guidance for derived resets).
  if (dueKeys !== lastSeenKeys) {
    setLastSeenKeys(dueKeys);
    if (due.some((d) => !lastSeenKeys.split(",").includes(d.key))) setCollapsed(false);
  }

  function changed() {
    window.dispatchEvent(new Event(HEALTH_DATA_CHANGED_EVENT));
  }

  async function handleDose(slot: DoseSlot, status: "taken" | "skipped") {
    const key = doseKey(slot);
    setBusyKey(key);
    const { error } = await api.POST("/health/medications/doses", {
      body: { medicationId: slot.medicationId, scheduledFor: slot.scheduledFor, status },
    });
    setBusyKey(null);
    if (error) return;
    setDoses((prev) => prev.map((s) => (doseKey(s) === key ? { ...s, status } : s)));
    changed();
  }

  async function handleReminder(reminder: Reminder, action: "complete" | "snooze") {
    setBusyKey(reminderKey(reminder));
    const params = { path: { id: reminder._id } };
    const result =
      action === "complete"
        ? await api.POST("/health/reminders/{id}/complete", { params })
        : await api.POST("/health/reminders/{id}/snooze", { params, body: { minutes: SNOOZE_MINUTES } });
    setBusyKey(null);
    if (result.error || !result.data) return;
    const updated = result.data;
    setReminders((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    changed();
  }

  function handleSnoozeDose(item: DueItem) {
    const map = readMap(SNOOZE_KEY);
    map[item.key] = Date.now() + SNOOZE_MINUTES * 60_000;
    writeMap(SNOOZE_KEY, map);
    setNow(Date.now());
  }

  if (due.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Due reminders"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96"
    >
      {collapsed ? (
        <Button className="pointer-events-auto self-end shadow-lg" onClick={() => setCollapsed(false)}>
          <BellRingingIcon /> {due.length} due now
        </Button>
      ) : (
        <>
          <div className="pointer-events-auto flex items-center justify-between self-stretch px-1">
            <span className="text-xs font-medium text-muted-foreground">Due now</span>
            <Button variant="ghost" size="icon-sm" aria-label="Hide" onClick={() => setCollapsed(true)}>
              <XIcon />
            </Button>
          </div>
          {due.slice(0, 3).map((item) => (
            <DueItemCard
              key={item.key}
              item={item}
              busy={busyKey === item.key}
              onDose={handleDose}
              onReminder={handleReminder}
              onSnooze={handleSnoozeDose}
            />
          ))}
          {due.length > 3 && (
            <div className="pointer-events-auto self-end text-xs text-muted-foreground">+{due.length - 3} more</div>
          )}
        </>
      )}
    </div>
  );
}

// Mounted once at the root: watches today's medicine doses (generated from
// each medication's schedule) and general reminders, and surfaces whatever
// is due — in-app, plus a system notification when permission is granted.
// Works while any Swasthya Saathi tab is open; closed-tab delivery would need
// Web Push, which isn't set up yet.
function ReminderNotifier() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <ReminderTray />;
}

function useNotificationPermission() {
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default");
  React.useEffect(() => {
    const read = () =>
      setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    const initial = setTimeout(read, 0);
    return () => clearTimeout(initial);
  }, []);

  const request = React.useCallback(async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  }, []);

  return { permission, request };
}

// Only renders while there's something to ask for — hidden once granted,
// denied (the browser won't re-prompt), or unsupported.
function EnableNotificationsButton() {
  const { permission, request } = useNotificationPermission();
  if (permission !== "default") return null;
  return (
    <Button type="button" size="sm" variant="outline" onClick={request}>
      <BellRingingIcon /> Enable alerts
    </Button>
  );
}

export { ReminderNotifier, EnableNotificationsButton };
