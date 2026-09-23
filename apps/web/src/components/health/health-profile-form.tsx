"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const BLOOD_GROUPS = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

type FormState = {
  heightCm: string;
  weightKg: string;
  bloodGroup: (typeof BLOOD_GROUPS)[number];
  allergies: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  heightCm: "",
  weightKg: "",
  bloodGroup: "unknown",
  allergies: "",
  notes: "",
};

function HealthProfileForm() {
  const api = useApiClient();
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = React.useState<"loading" | "ready">("loading");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await api.GET("/health/profile");
      if (cancelled) return;

      if (fetchError) {
        setError("Couldn't load your health profile.");
      } else if (data) {
        setForm({
          heightCm: data.heightCm?.toString() ?? "",
          weightKg: data.weightKg?.toString() ?? "",
          bloodGroup: data.bloodGroup ?? "unknown",
          allergies: (data.allergies ?? []).join(", "),
          notes: data.notes ?? "",
        });
      }
      setStatus("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { error: saveError } = await api.PUT("/health/profile", {
      body: {
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies
          .split(",")
          .map((allergy) => allergy.trim())
          .filter(Boolean),
        notes: form.notes || undefined,
      },
    });

    setSaving(false);
    if (saveError) {
      setError("Couldn't save your health profile. Please try again.");
    } else {
      setSavedAt(Date.now());
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-2xl p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Health Profile</CardTitle>
          <CardDescription>Basic information used across your Health Companion.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field orientation="responsive">
                <FieldLabel htmlFor="heightCm">Height (cm)</FieldLabel>
                <FieldContent>
                  <Input
                    id="heightCm"
                    type="number"
                    min={30}
                    max={300}
                    value={form.heightCm}
                    onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                  />
                </FieldContent>
              </Field>

              <Field orientation="responsive">
                <FieldLabel htmlFor="weightKg">Weight (kg)</FieldLabel>
                <FieldContent>
                  <Input
                    id="weightKg"
                    type="number"
                    min={1}
                    max={500}
                    value={form.weightKg}
                    onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                  />
                </FieldContent>
              </Field>

              <Field orientation="responsive">
                <FieldLabel htmlFor="bloodGroup">Blood group</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="bloodGroup"
                    value={form.bloodGroup}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bloodGroup: event.target.value as FormState["bloodGroup"],
                      }))
                    }
                  >
                    {BLOOD_GROUPS.map((group) => (
                      <NativeSelectOption key={group} value={group}>
                        {group === "unknown" ? "Unknown" : group}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                <FieldContent>
                  <Input
                    id="allergies"
                    placeholder="e.g. Penicillin, Peanuts"
                    value={form.allergies}
                    onChange={(event) => setForm((prev) => ({ ...prev, allergies: event.target.value }))}
                  />
                  <FieldDescription>Comma-separated.</FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Basic health history</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Anything else worth knowing about your health background"
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </FieldContent>
              </Field>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save profile"}
                </Button>
                {savedAt && !saving && <span className="text-xs text-muted-foreground">Saved.</span>}
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { HealthProfileForm };
