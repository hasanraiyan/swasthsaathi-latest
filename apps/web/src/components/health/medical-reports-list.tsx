"use client";

import * as React from "react";
import { useApiClient } from "@/hooks/use-api-client";
import type { components } from "@swasthsaathi/sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DownloadSimpleIcon, FileImageIcon, FilePdfIcon, UploadSimpleIcon } from "@phosphor-icons/react";

type MedicalReport = components["schemas"]["MedicalReportDto"];
type ReportCategory = MedicalReport["category"];

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  lab_result: "Lab result",
  prescription: "Prescription",
  imaging: "Imaging / scan",
  discharge_summary: "Discharge summary",
  consultation: "Consultation note",
  vaccination: "Vaccination",
  other: "Other",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ReportCategory[];

// Mirrors the API's limits (medical-report.schema.ts) so the user hears about
// a wrong file before uploading it, not after.
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 15 * 1024 * 1024;

type ReportFormState = {
  title: string;
  category: ReportCategory;
  reportDate: string;
  provider: string;
  notes: string;
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toFormState(report: MedicalReport | null): ReportFormState {
  if (!report) return { title: "", category: "lab_result", reportDate: today(), provider: "", notes: "" };
  return {
    title: report.title,
    category: report.category,
    reportDate: report.reportDate.slice(0, 10),
    provider: report.provider ?? "",
    notes: report.notes ?? "",
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function ReportDialog({
  open,
  onOpenChange,
  report,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: MedicalReport | null;
  onSaved: (report: MedicalReport) => void;
}) {
  const api = useApiClient();
  const isEditing = report !== null;
  // Initial state only — the parent remounts this via `key` per report.
  const [form, setForm] = React.useState<ReportFormState>(() => toFormState(report));
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setError(null);
    if (picked && picked.size > MAX_BYTES) {
      setError("That file is larger than 15 MB.");
      setFile(null);
      return;
    }
    setFile(picked);
    if (picked && !form.title) setForm((prev) => ({ ...prev, title: titleFromFilename(picked.name) }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || (!isEditing && !file)) return;
    setSaving(true);
    setError(null);

    const fields = {
      title: form.title.trim(),
      category: form.category,
      reportDate: form.reportDate,
      provider: form.provider.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    let result: { data?: MedicalReport; error?: unknown };
    if (isEditing) {
      result = await api.PATCH("/health/reports/{id}", { params: { path: { id: report._id } }, body: fields });
    } else {
      const formData = new FormData();
      formData.append("file", file!);
      for (const [key, value] of Object.entries(fields)) if (value) formData.append(key, value);
      // openapi-fetch passes FormData through untouched and lets the browser
      // set the multipart boundary.
      result = await api.POST("/health/reports", {
        body: formData as unknown as never,
        bodySerializer: (body: unknown) => body as FormData,
      });
    }

    setSaving(false);
    if (result.error || !result.data) {
      const message = (result.error as { message?: string | string[] } | undefined)?.message;
      setError(
        (Array.isArray(message) ? message[0] : message) ?? "Couldn't save this report. Please try again.",
      );
      return;
    }
    onSaved(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit report" : "Upload report"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this report's details." : "Add a lab result, prescription, scan or other medical document."}
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
              <Field>
                <FieldLabel htmlFor="report-file">File</FieldLabel>
                <FieldContent>
                  <Input id="report-file" type="file" accept={ACCEPT} required onChange={handleFileChange} />
                  <FieldDescription>PDF, JPEG, PNG or WebP, up to 15 MB.</FieldDescription>
                </FieldContent>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="report-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="report-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. HbA1c — September"
                />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="report-category">Type</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="report-category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ReportCategory }))}
                >
                  {CATEGORIES.map((category) => (
                    <NativeSelectOption key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="report-date">Report date</FieldLabel>
              <FieldContent>
                <Input
                  id="report-date"
                  type="date"
                  required
                  max={today()}
                  value={form.reportDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, reportDate: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="report-provider">Lab / hospital / doctor</FieldLabel>
              <FieldContent>
                <Input
                  id="report-provider"
                  value={form.provider}
                  onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="report-notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="report-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saving || !form.title.trim() || (!isEditing && !file)}>
                {saving ? (isEditing ? "Saving..." : "Uploading...") : isEditing ? "Save" : "Upload"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// The file endpoint needs the bearer token, so it can't be a plain <a href> —
// fetch it as a blob and preview that via an object URL instead.
function ReportPreviewDialog({ report, onOpenChange }: { report: MedicalReport | null; onOpenChange: (open: boolean) => void }) {
  const api = useApiClient();
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!report) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/reports/{id}/file", {
        params: { path: { id: report!._id } },
        parseAs: "blob",
      });
      if (cancelled) return;
      if (fetchError || !data) {
        setError(true);
        return;
      }
      objectUrl = URL.createObjectURL(data as Blob);
      setUrl(objectUrl);
    }
    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, report]);

  const isPdf = report?.file.mimeType === "application/pdf";

  return (
    <Dialog open={report !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{report?.title}</DialogTitle>
          <DialogDescription>
            {report && `${CATEGORY_LABELS[report.category]} · ${new Date(report.reportDate).toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-md border bg-muted/30">
          {error ? (
            <p className="text-xs text-muted-foreground">Couldn&apos;t load this file.</p>
          ) : !url ? (
            <Spinner />
          ) : isPdf ? (
            <iframe src={url} title={report?.title} className="size-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image can't optimise it
            <img src={url} alt={report?.title ?? "Report"} className="max-h-full max-w-full object-contain" />
          )}
        </div>
        <DialogFooter>
          {url && report && (
            <Button render={<a href={url} download={report.file.filename} />} variant="outline">
              <DownloadSimpleIcon /> Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportRow({
  report,
  onView,
  onEdit,
  onDelete,
}: {
  report: MedicalReport;
  onView: (report: MedicalReport) => void;
  onEdit: (report: MedicalReport) => void;
  onDelete: (report: MedicalReport) => void;
}) {
  const FileIcon = report.file.mimeType === "application/pdf" ? FilePdfIcon : FileImageIcon;
  return (
    <Item className="items-start border-b py-3 last:border-b-0">
      <FileIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="text-left hover:underline" onClick={() => onView(report)}>
            <ItemTitle>{report.title}</ItemTitle>
          </button>
          <Badge variant="outline">{CATEGORY_LABELS[report.category]}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(report.reportDate).toLocaleDateString()}
          {report.provider && ` · ${report.provider}`} · {formatSize(report.file.size)}
        </div>
        {report.notes && <div className="text-xs text-muted-foreground">{report.notes}</div>}
      </ItemContent>
      <ItemActions className="flex-wrap justify-end gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => onView(report)}>
          View
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(report)}>
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(report)}>
          Delete
        </Button>
      </ItemActions>
    </Item>
  );
}

function MedicalReportsList() {
  const api = useApiClient();
  const [reports, setReports] = React.useState<MedicalReport[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingReport, setEditingReport] = React.useState<MedicalReport | null>(null);
  const [viewingReport, setViewingReport] = React.useState<MedicalReport | null>(null);
  const [deletingReport, setDeletingReport] = React.useState<MedicalReport | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await api.GET("/health/reports");
      if (cancelled) return;
      if (fetchError) setError("Couldn't load your reports.");
      else setReports(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  function upsertLocal(updated: MedicalReport) {
    setReports((prev) => {
      const rest = (prev ?? []).filter((r) => r._id !== updated._id);
      return [updated, ...rest].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    });
  }

  async function confirmDelete() {
    if (!deletingReport) return;
    const target = deletingReport;
    setDeletingReport(null);
    const { error: deleteError } = await api.DELETE("/health/reports/{id}", { params: { path: { id: target._id } } });
    if (deleteError) {
      setError("Couldn't delete that report.");
      return;
    }
    setReports((prev) => prev?.filter((r) => r._id !== target._id) ?? null);
  }

  function openUpload() {
    setEditingReport(null);
    setDialogOpen(true);
  }

  function openEdit(report: MedicalReport) {
    setEditingReport(report);
    setDialogOpen(true);
  }

  if (reports === null && !error) {
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
            <CardTitle>Medical Reports</CardTitle>
            <CardDescription>Lab results, prescriptions, scans and other records.</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openUpload}>
            <UploadSimpleIcon /> Upload
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {reports && reports.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reports uploaded yet.</p>
          ) : (
            reports?.map((report) => (
              <ReportRow
                key={report._id}
                report={report}
                onView={setViewingReport}
                onEdit={openEdit}
                onDelete={setDeletingReport}
              />
            ))
          )}
        </CardContent>
      </Card>

      <ReportDialog
        key={editingReport?._id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={editingReport}
        onSaved={upsertLocal}
      />

      <ReportPreviewDialog
        key={viewingReport?._id ?? "none"}
        report={viewingReport}
        onOpenChange={(open) => !open && setViewingReport(null)}
      />

      <AlertDialog open={deletingReport !== null} onOpenChange={(open) => !open && setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingReport?.title}&rdquo; and its file will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { MedicalReportsList };
