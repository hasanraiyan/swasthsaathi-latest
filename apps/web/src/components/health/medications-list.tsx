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
import { Field, FieldContent, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "@phosphor-icons/react";

type Medication = components["schemas"]["MedicationDto"];
type HealthCondition = components["schemas"]["HealthConditionDto"];
type MedicationFrequency = Medication["frequency"];
type MedicationStatus = Medication["status"];

const FREQUENCY_OPTIONS: { value: MedicationFrequency; label: string; doses: number }[] = [
  { value: "once_daily", label: "Once daily", doses: 1 },
  { value: "twice_daily", label: "Twice daily", doses: 2 },
  { value: "three_times_daily", label: "Three times daily", doses: 3 },
  { value: "four_times_daily", label: "Four times daily", doses: 4 },
  { value: "as_needed", label: "As needed", doses: 0 },
];

const STATUS_LABEL: Record<MedicationStatus, string> = {
  active: "Active",
  paused: "Paused",
  stopped: "Stopped",
};

function dosesFor(frequency: MedicationFrequency): number {
  return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.doses ?? 0;
}

function resizeTimes(times: string[], count: number): string[] {
  if (times.length === count) return times;
  if (times.length > count) return times.slice(0, count);
  return [...times, ...Array(count - times.length).fill("")];
}

type MedicationFormState = {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[];
  startDate: string;
  endDate: string;
  instructions: string;
  conditionId: string;
};

function emptyForm(): MedicationFormState {
  return {
    name: "",
    dosage: "",
    frequency: "once_daily",
    times: resizeTimes([], 1),
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    instructions: "",
    conditionId: "",
  };
}

function toFormState(medication: Medication): MedicationFormState {
  return {
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    times: resizeTimes(medication.times ?? [], dosesFor(medication.frequency)),
    startDate: medication.startDate.slice(0, 10),
    endDate: medication.endDate ? medication.endDate.slice(0, 10) : "",
    instructions: medication.instructions ?? "",
    conditionId: medication.conditionId ?? "",
  };
}

function MedicationDialog({
  open,
  onOpenChange,
  medication,
  conditions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  conditions: HealthCondition[];
  onSaved: (medication: Medication) => void;
}) {
  const api = useApiClient();
  // Initial state only — the parent remounts this component (via `key`) each
  // time it opens for a different medication, mirroring ConditionDialog.
  const [form, setForm] = React.useState<MedicationFormState>(() =>
    medication ? toFormState(medication) : emptyForm()
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFrequencyChange(frequency: MedicationFrequency) {
    setForm((prev) => ({ ...prev, frequency, times: resizeTimes(prev.times, dosesFor(frequency)) }));
  }

  function handleTimeChange(index: number, value: string) {
    setForm((prev) => {
      const times = [...prev.times];
      times[index] = value;
      return { ...prev, times };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.dosage.trim()) return;
    setSaving(true);
    setError(null);

    const body = {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency,
      times: form.frequency === "as_needed" ? [] : form.times.filter(Boolean),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      instructions: form.instructions || undefined,
      conditionId: form.conditionId || undefined,
    };

    const result = medication
      ? await api.PATCH("/health/medications/{id}", { params: { path: { id: medication._id } }, body })
      : await api.POST("/health/medications", { body });

    setSaving(false);
    if (result.error || !result.data) {
      setError("Couldn't save this medication. Please try again.");
      return;
    }
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{medication ? "Edit medication" : "Add medication"}</DialogTitle>
          <DialogDescription>
            {medication ? "Update this medication's details." : "Add a medication to track."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field orientation="responsive">
              <FieldLabel htmlFor="med-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="med-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Metformin"
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="med-dosage">Dosage</FieldLabel>
              <FieldContent>
                <Input
                  id="med-dosage"
                  required
                  value={form.dosage}
                  onChange={(e) => setForm((prev) => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g. 500 mg"
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="med-frequency">Frequency</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="med-frequency"
                  value={form.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as MedicationFrequency)}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            {form.times.length > 0 && (
              <Field>
                <FieldLabel>Times</FieldLabel>
                <FieldContent>
                  <div className="flex flex-wrap gap-2">
                    {form.times.map((time, index) => (
                      <Input
                        key={index}
                        type="time"
                        required
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="w-32"
                      />
                    ))}
                  </div>
                </FieldContent>
              </Field>
            )}
            <Field orientation="responsive">
              <FieldLabel htmlFor="med-start">Start date</FieldLabel>
              <FieldContent>
                <Input
                  id="med-start"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="med-end">End date</FieldLabel>
              <FieldContent>
                <Input
                  id="med-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
                <FieldDescription>Optional.</FieldDescription>
              </FieldContent>
            </Field>
            {conditions.length > 0 && (
              <Field orientation="responsive">
                <FieldLabel htmlFor="med-condition">Linked condition</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="med-condition"
                    value={form.conditionId}
                    onChange={(e) => setForm((prev) => ({ ...prev, conditionId: e.target.value }))}
                  >
                    <NativeSelectOption value="">None</NativeSelectOption>
                    {conditions.map((condition) => (
                      <NativeSelectOption key={condition._id} value={condition._id}>
                        {condition.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="med-instructions">Instructions</FieldLabel>
              <FieldContent>
                <Textarea
                  id="med-instructions"
                  rows={2}
                  value={form.instructions}
                  onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="e.g. Take with food"
                />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saving || !form.name.trim() || !form.dosage.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MedicationRow({
  medication,
  conditionName,
  onChangeStatus,
  onEdit,
}: {
  medication: Medication;
  conditionName?: string;
  onChangeStatus: (medication: Medication, status: MedicationStatus) => void;
  onEdit: (medication: Medication) => void;
}) {
  const frequencyLabel = FREQUENCY_OPTIONS.find((f) => f.value === medication.frequency)?.label;
  return (
    <Item className="items-start border-b py-3 last:border-b-0">
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>
            {medication.name} · {medication.dosage}
          </ItemTitle>
          <Badge variant={medication.status === "active" ? "default" : "outline"}>
            {STATUS_LABEL[medication.status]}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {frequencyLabel}
          {medication.times.length > 0 && ` · ${medication.times.join(", ")}`}
        </div>
        {conditionName && <div className="text-xs text-muted-foreground">For: {conditionName}</div>}
        {medication.instructions && <div className="text-xs text-muted-foreground">{medication.instructions}</div>}
      </ItemContent>
      <ItemActions className="flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(medication)}>
          Edit
        </Button>
        {medication.status === "active" && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChangeStatus(medication, "paused")}>
            Pause
          </Button>
        )}
        {medication.status === "paused" && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChangeStatus(medication, "active")}>
            Resume
          </Button>
        )}
        {medication.status !== "stopped" && (
          <Button type="button" variant="destructive" size="sm" onClick={() => onChangeStatus(medication, "stopped")}>
            Stop
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}

function MedicationsList() {
  const api = useApiClient();
  const [medications, setMedications] = React.useState<Medication[] | null>(null);
  const [conditions, setConditions] = React.useState<HealthCondition[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMedication, setEditingMedication] = React.useState<Medication | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const [medsResult, conditionsResult] = await Promise.all([
        api.GET("/health/medications"),
        api.GET("/health/conditions"),
      ]);
      if (cancelled) return;
      if (medsResult.error) {
        setError("Couldn't load your medications.");
      } else {
        setMedications(medsResult.data ?? []);
      }
      if (conditionsResult.data) setConditions(conditionsResult.data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const conditionNameById = React.useMemo(
    () => new Map(conditions.map((c) => [c._id, c.name])),
    [conditions]
  );

  function upsertLocal(updated: Medication) {
    setMedications((prev) => {
      if (!prev) return [updated];
      const index = prev.findIndex((m) => m._id === updated._id);
      if (index === -1) return [updated, ...prev];
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function handleChangeStatus(medication: Medication, status: MedicationStatus) {
    const { data, error: statusError } = await api.PATCH("/health/medications/{id}", {
      params: { path: { id: medication._id } },
      body: { status },
    });
    if (!statusError && data) upsertLocal(data);
  }

  function openAddDialog() {
    setEditingMedication(null);
    setDialogOpen(true);
  }

  function openEditDialog(medication: Medication) {
    setEditingMedication(medication);
    setDialogOpen(true);
  }

  if (medications === null && !error) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Medications</CardTitle>
            <CardDescription>What you&apos;re taking, and when.</CardDescription>
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
          {medications && medications.length === 0 ? (
            <p className="text-xs text-muted-foreground">No medications added yet.</p>
          ) : (
            medications?.map((medication) => (
              <MedicationRow
                key={medication._id}
                medication={medication}
                conditionName={medication.conditionId ? conditionNameById.get(medication.conditionId) : undefined}
                onChangeStatus={handleChangeStatus}
                onEdit={openEditDialog}
              />
            ))
          )}
        </CardContent>
      </Card>

      <MedicationDialog
        key={editingMedication?._id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        medication={editingMedication}
        conditions={conditions}
        onSaved={upsertLocal}
      />
    </div>
  );
}

export { MedicationsList };
