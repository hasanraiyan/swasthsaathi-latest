"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import type { components } from "@swasthsaathi/sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

type Measurement = components["schemas"]["HealthMeasurementDto"];
type MeasurementType = Measurement["type"];

const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  weight: "Weight",
  blood_pressure: "Blood Pressure",
  blood_glucose: "Blood Glucose",
  heart_rate: "Heart Rate",
  temperature: "Temperature",
  oxygen_level: "Oxygen Level",
  other: "Other",
};

const MEASUREMENT_TYPES = Object.keys(MEASUREMENT_LABELS) as MeasurementType[];

function displayName(m: Measurement): string {
  return m.type === "other" ? m.label || "Other" : MEASUREMENT_LABELS[m.type];
}

function formatValue(m: Measurement): string {
  if (m.type === "blood_pressure") return `${m.value}/${m.secondaryValue ?? "?"} ${m.unit}`;
  return `${m.value} ${m.unit}`;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Note: "other" is a single shared type across every custom label (Steps,
// Water intake, ...), so "latest"/trend for it blend whatever labels the user
// has logged rather than tracking one metric — acceptable for an occasional
// catch-all bucket, not meant to replace a real custom-metric type.
function computeTrend(entriesDesc: Measurement[]): { delta: number; days: number } | null {
  if (entriesDesc.length < 2) return null;
  const latest = entriesDesc[0];
  const latestTime = new Date(latest.recordedAt).getTime();
  const cutoff = latestTime - 30 * 24 * 60 * 60 * 1000;
  const reference = entriesDesc.find((e) => new Date(e.recordedAt).getTime() <= cutoff) ?? entriesDesc[entriesDesc.length - 1];
  if (reference === latest) return null;
  const days = Math.round((latestTime - new Date(reference.recordedAt).getTime()) / (24 * 60 * 60 * 1000));
  return { delta: latest.value - reference.value, days };
}

type FormState = {
  type: MeasurementType;
  value: string;
  secondaryValue: string;
  label: string;
  unit: string;
  recordedAt: string;
  notes: string;
};

function emptyForm(defaultType: MeasurementType): FormState {
  return {
    type: defaultType,
    value: "",
    secondaryValue: "",
    label: "",
    unit: "",
    recordedAt: toDatetimeLocalValue(new Date()),
    notes: "",
  };
}

function toFormState(m: Measurement): FormState {
  return {
    type: m.type,
    value: String(m.value),
    secondaryValue: m.secondaryValue !== undefined ? String(m.secondaryValue) : "",
    label: m.label ?? "",
    unit: m.type === "other" ? m.unit : "",
    recordedAt: toDatetimeLocalValue(new Date(m.recordedAt)),
    notes: m.notes ?? "",
  };
}

function MeasurementDialog({
  open,
  onOpenChange,
  measurement,
  defaultType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurement: Measurement | null;
  defaultType: MeasurementType;
  onSaved: (measurement: Measurement) => void;
}) {
  const api = useApiClient();
  // Initial state only — the parent remounts this via `key` per edit target,
  // same pattern as ConditionDialog/MedicationDialog.
  const [form, setForm] = React.useState<FormState>(() =>
    measurement ? toFormState(measurement) : emptyForm(defaultType)
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isEditing = measurement !== null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.value.trim()) return;
    setSaving(true);
    setError(null);

    const recordedAt = new Date(form.recordedAt).toISOString();
    const value = Number(form.value);
    const secondaryValue = form.secondaryValue ? Number(form.secondaryValue) : undefined;

    const result = isEditing
      ? await api.PATCH("/health/measurements/{id}", {
          params: { path: { id: measurement._id } },
          body: {
            value,
            secondaryValue,
            label: form.type === "other" ? form.label : undefined,
            recordedAt,
            notes: form.notes || undefined,
          },
        })
      : await api.POST("/health/measurements", {
          body: {
            type: form.type,
            value,
            secondaryValue,
            label: form.type === "other" ? form.label : undefined,
            unit: form.type === "other" ? form.unit : undefined,
            recordedAt,
            notes: form.notes || undefined,
          },
        });

    setSaving(false);
    if (result.error || !result.data) {
      setError("Couldn't save this measurement. Please try again.");
      return;
    }
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit measurement" : "Add measurement"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this reading." : "Record a new health measurement."}
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
            {!isEditing && (
              <Field orientation="responsive">
                <FieldLabel htmlFor="measurement-type">Type</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="measurement-type"
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as MeasurementType }))}
                  >
                    {MEASUREMENT_TYPES.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {MEASUREMENT_LABELS[type]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>
            )}
            {form.type === "other" && !isEditing && (
              <Field orientation="responsive">
                <FieldLabel htmlFor="measurement-unit">Unit</FieldLabel>
                <FieldContent>
                  <Input
                    id="measurement-unit"
                    required
                    value={form.unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g. steps"
                  />
                </FieldContent>
              </Field>
            )}
            {form.type === "other" && (
              <Field orientation="responsive">
                <FieldLabel htmlFor="measurement-label">Label</FieldLabel>
                <FieldContent>
                  <Input
                    id="measurement-label"
                    required
                    value={form.label}
                    onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Steps"
                  />
                </FieldContent>
              </Field>
            )}
            <Field orientation="responsive">
              <FieldLabel htmlFor="measurement-value">
                {form.type === "blood_pressure" ? "Systolic" : "Value"}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="measurement-value"
                  type="number"
                  required
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </FieldContent>
            </Field>
            {form.type === "blood_pressure" && (
              <Field orientation="responsive">
                <FieldLabel htmlFor="measurement-secondary">Diastolic</FieldLabel>
                <FieldContent>
                  <Input
                    id="measurement-secondary"
                    type="number"
                    required
                    value={form.secondaryValue}
                    onChange={(e) => setForm((prev) => ({ ...prev, secondaryValue: e.target.value }))}
                  />
                </FieldContent>
              </Field>
            )}
            <Field orientation="responsive">
              <FieldLabel htmlFor="measurement-recorded-at">Recorded at</FieldLabel>
              <FieldContent>
                <Input
                  id="measurement-recorded-at"
                  type="datetime-local"
                  required
                  value={form.recordedAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, recordedAt: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="measurement-notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="measurement-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saving || !form.value.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HealthMeasurementsList() {
  const api = useApiClient();
  const [selectedType, setSelectedType] = React.useState<MeasurementType>("weight");
  const [measurements, setMeasurements] = React.useState<Measurement[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMeasurement, setEditingMeasurement] = React.useState<Measurement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    // Deliberately doesn't clear `measurements` to null before fetching — the
    // previous type's readings stay on screen (rather than flashing the
    // skeleton) until the new type's data arrives.
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/measurements", {
        params: { query: { type: selectedType } },
      });
      if (cancelled) return;
      if (fetchError) {
        setError("Couldn't load your measurements.");
      } else {
        setError(null);
        setMeasurements(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api, selectedType]);

  function upsertLocal(updated: Measurement) {
    if (updated.type !== selectedType) {
      setSelectedType(updated.type);
      return;
    }
    setMeasurements((prev) => {
      if (!prev) return [updated];
      const index = prev.findIndex((m) => m._id === updated._id);
      if (index === -1) {
        return [updated, ...prev].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function handleDelete(measurement: Measurement) {
    const { error: deleteError } = await api.DELETE("/health/measurements/{id}", {
      params: { path: { id: measurement._id } },
    });
    if (deleteError) return;
    setMeasurements((prev) => prev?.filter((m) => m._id !== measurement._id) ?? null);
  }

  function openAddDialog() {
    setEditingMeasurement(null);
    setDialogOpen(true);
  }

  function openEditDialog(measurement: Measurement) {
    setEditingMeasurement(measurement);
    setDialogOpen(true);
  }

  const trend = measurements ? computeTrend(measurements) : null;
  const latest = measurements?.[0];

  return (
    <div className="mx-auto w-full max-w-lg overflow-y-auto p-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>Health Measurements</CardTitle>
            <CardDescription>Track readings over time.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openAddDialog}>
            <PlusIcon /> Add
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <NativeSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value as MeasurementType)}>
            {MEASUREMENT_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {MEASUREMENT_LABELS[type]}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {measurements === null && !error ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              {latest && (
                <div className="rounded-none border p-3">
                  {latest.type === "other" && (
                    <div className="text-xs text-muted-foreground">{displayName(latest)}</div>
                  )}
                  <div className="text-lg font-medium">{formatValue(latest)}</div>
                  {trend && (
                    <div className="text-xs text-muted-foreground">
                      Last {trend.days} days {trend.delta >= 0 ? "↑" : "↓"} {Math.abs(trend.delta)} {latest.unit}
                    </div>
                  )}
                </div>
              )}

              {measurements && measurements.length === 0 ? (
                <p className="text-xs text-muted-foreground">No {MEASUREMENT_LABELS[selectedType].toLowerCase()} readings yet.</p>
              ) : (
                measurements?.map((measurement) => (
                  <Item key={measurement._id} className="items-start border-b py-2 last:border-b-0">
                    <ItemContent className="min-w-0 gap-0.5">
                      <ItemTitle>
                        {measurement.type === "other" ? `${displayName(measurement)}: ` : ""}
                        {formatValue(measurement)}
                      </ItemTitle>
                      <div className="text-xs text-muted-foreground">
                        {new Date(measurement.recordedAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                      {measurement.notes && (
                        <div className="text-xs text-muted-foreground">{measurement.notes}</div>
                      )}
                    </ItemContent>
                    <ItemActions className="gap-1.5">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEditDialog(measurement)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(measurement)}>
                        Delete
                      </Button>
                    </ItemActions>
                  </Item>
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>

      <MeasurementDialog
        key={editingMeasurement?._id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        measurement={editingMeasurement}
        defaultType={selectedType}
        onSaved={upsertLocal}
      />
    </div>
  );
}

export { HealthMeasurementsList };
