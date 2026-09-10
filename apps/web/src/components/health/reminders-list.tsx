"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import type { components } from "@swasthsaathi/sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "@phosphor-icons/react";

type Reminder = components["schemas"]["ReminderDto"];
type ReminderRecurrence = Reminder["recurrence"];

const RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const SNOOZE_OPTIONS = [
  { minutes: 15, label: "+15m" },
  { minutes: 60, label: "+1h" },
  { minutes: 1440, label: "+1d" },
];

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type FormState = {
  title: string;
  scheduledFor: string;
  recurrence: ReminderRecurrence;
  notes: string;
};

function emptyForm(): FormState {
  const inOneHour = new Date(Date.now() + 60 * 60_000);
  return { title: "", scheduledFor: toDatetimeLocalValue(inOneHour), recurrence: "none", notes: "" };
}

function toFormState(reminder: Reminder): FormState {
  return {
    title: reminder.title,
    scheduledFor: toDatetimeLocalValue(new Date(reminder.scheduledFor)),
    recurrence: reminder.recurrence,
    notes: reminder.notes ?? "",
  };
}

function ReminderDialog({
  open,
  onOpenChange,
  reminder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onSaved: (reminder: Reminder) => void;
}) {
  const api = useApiClient();
  // Initial state only — the parent remounts this via `key` per edit target,
  // same pattern as the other Health Companion dialogs.
  const [form, setForm] = React.useState<FormState>(() => (reminder ? toFormState(reminder) : emptyForm()));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);

    const body = {
      title: form.title.trim(),
      scheduledFor: new Date(form.scheduledFor).toISOString(),
      recurrence: form.recurrence,
      notes: form.notes || undefined,
    };

    const result = reminder
      ? await api.PATCH("/health/reminders/{id}", { params: { path: { id: reminder._id } }, body })
      : await api.POST("/health/reminders", { body });

    setSaving(false);
    if (result.error || !result.data) {
      setError("Couldn't save this reminder. Please try again.");
      return;
    }
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reminder ? "Edit reminder" : "New reminder"}</DialogTitle>
          <DialogDescription>
            {reminder ? "Update this reminder." : "Reminders aren't just for medicine."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="reminder-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="reminder-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Drink water"
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="reminder-scheduled-for">Date &amp; time</FieldLabel>
              <FieldContent>
                <Input
                  id="reminder-scheduled-for"
                  type="datetime-local"
                  required
                  value={form.scheduledFor}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduledFor: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="reminder-recurrence">Repeat</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="reminder-recurrence"
                  value={form.recurrence}
                  onChange={(e) => setForm((prev) => ({ ...prev, recurrence: e.target.value as ReminderRecurrence }))}
                >
                  {(Object.keys(RECURRENCE_LABELS) as ReminderRecurrence[]).map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {RECURRENCE_LABELS[value]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="reminder-notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="reminder-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saving || !form.title.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReminderRow({
  reminder,
  onComplete,
  onSnooze,
  onCancel,
  onEdit,
}: {
  reminder: Reminder;
  onComplete: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes: number) => void;
  onCancel: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
}) {
  const isPending = reminder.status === "pending";
  return (
    <Item className="items-start border-b py-3 last:border-b-0">
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>{reminder.title}</ItemTitle>
          {reminder.recurrence !== "none" && <Badge variant="outline">{RECURRENCE_LABELS[reminder.recurrence]}</Badge>}
          {!isPending && (
            <Badge variant={reminder.status === "completed" ? "default" : "outline"}>
              {reminder.status === "completed" ? "Completed" : "Cancelled"}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(reminder.scheduledFor).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </div>
        {reminder.notes && <div className="text-xs text-muted-foreground">{reminder.notes}</div>}
      </ItemContent>
      <ItemActions className="flex-wrap justify-end gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(reminder)}>
          Edit
        </Button>
        {isPending && (
          <>
            {SNOOZE_OPTIONS.map(({ minutes, label }) => (
              <Button key={minutes} type="button" variant="outline" size="sm" onClick={() => onSnooze(reminder, minutes)}>
                {label}
              </Button>
            ))}
            <Button type="button" variant="default" size="sm" onClick={() => onComplete(reminder)}>
              Complete
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => onCancel(reminder)}>
              Cancel
            </Button>
          </>
        )}
      </ItemActions>
    </Item>
  );
}

function RemindersList() {
  const api = useApiClient();
  const [reminders, setReminders] = React.useState<Reminder[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingReminder, setEditingReminder] = React.useState<Reminder | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/reminders");
      if (cancelled) return;
      if (fetchError) {
        setError("Couldn't load your reminders.");
      } else {
        setReminders(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  function upsertLocal(updated: Reminder) {
    setReminders((prev) => {
      if (!prev) return [updated];
      const index = prev.findIndex((r) => r._id === updated._id);
      if (index === -1) return [updated, ...prev];
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function handleComplete(reminder: Reminder) {
    const { data, error: actionError } = await api.POST("/health/reminders/{id}/complete", {
      params: { path: { id: reminder._id } },
    });
    if (!actionError && data) upsertLocal(data);
  }

  async function handleSnooze(reminder: Reminder, minutes: number) {
    const { data, error: actionError } = await api.POST("/health/reminders/{id}/snooze", {
      params: { path: { id: reminder._id } },
      body: { minutes },
    });
    if (!actionError && data) upsertLocal(data);
  }

  async function handleCancel(reminder: Reminder) {
    const { data, error: actionError } = await api.POST("/health/reminders/{id}/cancel", {
      params: { path: { id: reminder._id } },
    });
    if (!actionError && data) upsertLocal(data);
  }

  function openAddDialog() {
    setEditingReminder(null);
    setDialogOpen(true);
  }

  function openEditDialog(reminder: Reminder) {
    setEditingReminder(reminder);
    setDialogOpen(true);
  }

  if (reminders === null && !error) {
    return (
      <div className="mx-auto w-full max-w-lg p-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg overflow-y-auto p-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>Not everything is a medicine.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openAddDialog}>
            <PlusIcon /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {reminders && reminders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reminders yet.</p>
          ) : (
            reminders?.map((reminder) => (
              <ReminderRow
                key={reminder._id}
                reminder={reminder}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onCancel={handleCancel}
                onEdit={openEditDialog}
              />
            ))
          )}
        </CardContent>
      </Card>

      <ReminderDialog
        key={editingReminder?._id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={editingReminder}
        onSaved={upsertLocal}
      />
    </div>
  );
}

export { RemindersList };
