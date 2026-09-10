"use client";

import * as React from "react";
import { FileCodeIcon, FileTextIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Item } from "@/components/ui/item";
import { parseToolArgs, CODE_EXTENSIONS, fileExtOf, getToolCallStatus } from "./utils";
import type { PersonaToolCall } from "@personaai/react";

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export function parseGrepResults(resultText: string | undefined): GrepMatch[] {
  if (!resultText) return [];

  try {
    const parsed = JSON.parse(resultText);
    const matches = Array.isArray(parsed) ? parsed : parsed?.matches || parsed?.results;
    if (Array.isArray(matches)) {
      return matches
        .map((m) => ({
          file: m.Filename || m.filename || m.file || m.path || "",
          line: m.LineNumber || m.lineNumber || m.line || 0,
          content: m.LineContent || m.lineContent || m.content || "",
        }))
        .filter((m) => m.file);
    }
  } catch {
    // fall through to plain-text parsing
  }

  const matches: GrepMatch[] = [];
  const lines = resultText.split("\n");
  let currentFile = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.endsWith(":") && !/^\d+:/.test(line)) {
      currentFile = line.slice(0, -1).trim();
    } else if (currentFile) {
      const match = line.match(/^(\d+):(.*)$/);
      if (match) {
        matches.push({ file: currentFile, line: parseInt(match[1], 10), content: match[2] });
      } else {
        matches.push({ file: currentFile, line: 0, content: line });
      }
    }
  }

  if (matches.length === 0) {
    return lines
      .map((l) => l.trim())
      .filter((l) => l && (l.startsWith("/") || l.includes(".") || l.includes("\\")))
      .map((l) => ({ file: l, line: 0, content: "" }));
  }

  return matches;
}

function escapeRegex(value: string): string {
  return value.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  try {
    const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="rounded-[2px] bg-[var(--mark-highlight)] px-0.5 font-semibold text-foreground dark:bg-[var(--mark-highlight-dark)]">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch {
    return text;
  }
}

export function GrepResultsView({ toolCall }: { toolCall: PersonaToolCall }) {
  const parsedInput = parseToolArgs(toolCall.args) || {};
  const query = (parsedInput.pattern as string) || (parsedInput.Query as string) || (parsedInput.query as string) || "";
  const path = (parsedInput.path as string) || (parsedInput.SearchPath as string) || (parsedInput.searchPath as string) || "/";
  const results = parseGrepResults(toolCall.result);
  const done = getToolCallStatus(toolCall) !== "running";

  const fileGroups: Record<string, GrepMatch[]> = {};
  for (const match of results) {
    (fileGroups[match.file] ??= []).push(match);
  }
  const groupEntries = Object.entries(fileGroups);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground font-semibold uppercase tracking-wider">Grep:</span>
        <Badge variant="secondary" className="gap-1 bg-blue-50 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          <MagnifyingGlassIcon className="size-3" />
          &quot;{query}&quot;
        </Badge>
        <span className="text-muted-foreground">in</span>
        <Badge variant="secondary" className="font-semibold">{path}</Badge>
      </div>

      {!done ? (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Searching…</div>
          <Skeleton className="h-8 w-full" aria-busy="true" />
        </div>
      ) : groupEntries.length > 0 ? (
        <ScrollArea className="max-h-60">
          <div className="flex flex-col gap-2.5 pr-2">
          {groupEntries.map(([filePath, matches]) => {
            const fileName = filePath.split("/").pop() || filePath;
            const isCode = CODE_EXTENSIONS.includes(fileExtOf(fileName));
            const FileIcon = isCode ? FileCodeIcon : FileTextIcon;

            return (
              <Card key={filePath} className="gap-0 overflow-hidden rounded-none py-0">
                <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/50 px-2.5 py-1.5">
                  <FileIcon className="size-3.5 text-muted-foreground" />
                  <span className="truncate font-mono text-xs font-semibold text-foreground">{filePath}</span>
                  <Badge variant="secondary" className="ml-auto px-1 py-0.5 text-[10px] font-bold">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border font-mono text-xs leading-relaxed">
                    {matches.map((match, i) => (
                      <Item key={i} size="sm" variant="default" className="flex-row gap-0 rounded-none p-0 hover:bg-muted/50">
                        {match.line > 0 && (
                          <div className="flex w-9 shrink-0 select-none items-center justify-end border-r border-border py-1.5 pr-2.5 text-right font-bold text-muted-foreground">
                            {match.line}
                          </div>
                        )}
                        <div className="flex-1 py-1.5 pl-3 pr-2 whitespace-pre-wrap break-all text-foreground">
                          {highlightMatch(match.content, query)}
                        </div>
                      </Item>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      ) : (
        <div className="text-xs text-muted-foreground italic">No matches found.</div>
      )}
    </div>
  );
}
