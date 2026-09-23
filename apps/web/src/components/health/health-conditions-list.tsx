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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "@phosphor-icons/react";

type HealthCondition = components["schemas"]["HealthConditionDto"];

type ConditionFormState = {
  name: string;
  diagnosedAt: string;
  notes: string;
};

const EMPTY_FORM: ConditionFormState = { name: "", diagnosedAt: "", notes: "" };

function toFormState(condition: HealthCondition): ConditionFormState {
  return {
    name: condition.name,
    diagnosedAt: condition.diagnosedAt ? condition.diagnosedAt.slice(0, 10) : "",
    notes: condition.notes ?? "",
  };
}

function ConditionDialog({
  open,
  onOpenChange,
  condition,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: HealthCondition | null;
  onSaved: (condition: HealthCondition) => void;
}) {
  const api = useApiClient();
  // Initial state only — the parent remounts this component (via `key`) each
  // time it opens for a different condition, so there's no "reset on prop
  // change" effect to write here.
  const [form, setForm] = React.useState<ConditionFormState>(() =>
    condition ? toFormState(condition) : EMPTY_FORM
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const body = {
      name: form.name.trim(),
      diagnosedAt: form.diagnosedAt || undefined,
      notes: form.notes || undefined,
    };

    const result = condition
      ? await api.PATCH("/health/conditions/{id}", { params: { path: { id: condition._id } }, body })
      : await api.POST("/health/conditions", { body });

    setSaving(false);
    if (result.error || !result.data) {
      setError("Couldn't save this condition. Please try again.");
      return;
    }
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{condition ? "Edit condition" : "Add condition"}</DialogTitle>
          <DialogDescription>
            {condition ? "Update this condition's details." : "Add a health condition to your record."}
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
              <FieldLabel htmlFor="condition-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="condition-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Type 2 Diabetes"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="condition-diagnosed-at">Diagnosed on</FieldLabel>
              <FieldContent>
                <Input
                  id="condition-diagnosed-at"
                  type="date"
                  value={form.diagnosedAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, diagnosedAt: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="condition-notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="condition-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConditionRow({
  condition,
  onToggleStatus,
  onEdit,
}: {
  condition: HealthCondition;
  onToggleStatus: (condition: HealthCondition) => void;
  onEdit: (condition: HealthCondition) => void;
}) {
  const isActive = condition.status === "active";
  return (
    <Item className="items-start border-b py-3 last:border-b-0">
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle>{condition.name}</ItemTitle>
          <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Active" : "Resolved"}</Badge>
        </div>
        {condition.diagnosedAt && (
          <div className="text-xs text-muted-foreground">
            Diagnosed {new Date(condition.diagnosedAt).toLocaleDateString()}
          </div>
        )}
        {condition.notes && <div className="text-xs text-muted-foreground">{condition.notes}</div>}
      </ItemContent>
      <ItemActions className="gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(condition)}>
          Edit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onToggleStatus(condition)}>
          {isActive ? "Mark resolved" : "Reactivate"}
        </Button>
      </ItemActions>
    </Item>
  );
}

function HealthConditionsList() {
  const api = useApiClient();
  const [conditions, setConditions] = React.useState<HealthCondition[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCondition, setEditingCondition] = React.useState<HealthCondition | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/conditions");
      if (cancelled) return;
      if (fetchError) {
        setError("Couldn't load your health conditions.");
      } else {
        setConditions(data ?? []);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  function upsertLocal(updated: HealthCondition) {
    setConditions((prev) => {
      if (!prev) return [updated];
      const index = prev.findIndex((c) => c._id === updated._id);
      if (index === -1) return [updated, ...prev];
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function handleToggleStatus(condition: HealthCondition) {
    const nextStatus = condition.status === "active" ? "resolved" : "active";
    const { data, error: toggleError } = await api.PATCH("/health/conditions/{id}", {
      params: { path: { id: condition._id } },
      body: { status: nextStatus },
    });
    if (!toggleError && data) upsertLocal(data);
  }

  function openAddDialog() {
    setEditingCondition(null);
    setDialogOpen(true);
  }

  function openEditDialog(condition: HealthCondition) {
    setEditingCondition(condition);
    setDialogOpen(true);
  }

  if (conditions === null && !error) {
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
            <CardTitle>Health Conditions</CardTitle>
            <CardDescription>Conditions you&apos;re managing, active or resolved.</CardDescription>
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
          {conditions && conditions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No conditions added yet.</p>
          ) : (
            conditions?.map((condition) => (
              <ConditionRow
                key={condition._id}
                condition={condition}
                onToggleStatus={handleToggleStatus}
                onEdit={openEditDialog}
              />
            ))
          )}
        </CardContent>
      </Card>

      <ConditionDialog
        key={editingCondition?._id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        condition={editingCondition}
        onSaved={upsertLocal}
      />
    </div>
  );
}

export { HealthConditionsList };
