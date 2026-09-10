"use client";

import { FileCodeIcon, FileTextIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getReadFileToolDetails, CODE_EXTENSIONS, fileExtOf, getToolCallStatus } from "./utils";
import type { PersonaToolCall } from "@personaai/react";

// Split file content into display lines + line numbers, stripping any
// "   1  content" prefixes the tool may have added.
function processLines(content: string, lineOffset: number) {
  if (!content) return { lines: [] as string[], lineNumbers: [] as number[] };
  const rawLines = content.split("\n");
  if (rawLines.length > 1 && rawLines[rawLines.length - 1] === "") {
    rawLines.pop();
  }

  let isPrefixed = true;
  const regex = /^\s*(\d+)(?:\s+(.*)|$)/;

  for (const line of rawLines) {
    if (line.trim() === "") continue;
    if (!regex.test(line)) {
      isPrefixed = false;
      break;
    }
  }

  if (isPrefixed && rawLines.length > 0) {
    const cleaned: string[] = [];
    const numbers: number[] = [];
    let lastNum = 0;

    for (const line of rawLines) {
      const match = line.match(regex);
      if (match) {
        cleaned.push(match[2] || "");
        lastNum = parseInt(match[1], 10);
        numbers.push(lastNum);
      } else {
        cleaned.push(line);
        lastNum += 1;
        numbers.push(lastNum);
      }
    }
    return { lines: cleaned, lineNumbers: numbers };
  }

  const offset = lineOffset || 0;
  const numbers = rawLines.map((_, i) => offset + i + 1);
  return { lines: rawLines, lineNumbers: numbers };
}

export function ReadFileCard({ toolCall }: { toolCall: PersonaToolCall }) {
  const details = getReadFileToolDetails(toolCall.args, toolCall.result);
  const content = details?.content ?? "";
  const otherArgs = details?.otherArgs ?? {};
  const filePath = details?.filePath ?? "";
  const lineOffset = (otherArgs.offset as number) ?? (otherArgs.offsetLine as number) ?? 0;

  const { lines, lineNumbers } = processLines(content, lineOffset);

  if (!details) {
    return (
      <Card className="rounded-none py-0">
        <CardContent className="p-0">
          <ScrollArea className="max-h-56 bg-muted">
            <pre className="whitespace-pre-wrap break-words p-2.5 font-mono text-xs leading-5 text-foreground">
              {toolCall.result || "No result yet."}
            </pre>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  const fileName = filePath.split("/").pop() || filePath;
  const isCode = CODE_EXTENSIONS.includes(fileExtOf(fileName));
  const FileIcon = isCode ? FileCodeIcon : FileTextIcon;
  const done = getToolCallStatus(toolCall) !== "running";

  return (
    <Card className="gap-0 overflow-hidden rounded-none py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-muted/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs font-semibold text-foreground">{filePath}</span>
        </div>
      </CardHeader>

      {!done ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Spinner className="size-5 mb-2 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Reading file content…</span>
        </div>
      ) : content ? (
        <ScrollArea orientation="both" className="max-h-72 bg-[var(--code-bg)] font-mono text-xs text-[var(--code-fg)]">
          <div className="flex min-w-full">
            <div className="w-10 shrink-0 select-none border-r border-[var(--code-gutter-border)] bg-[var(--code-gutter-bg)] py-3 pr-3 text-right text-[10px] font-bold text-[var(--code-gutter-fg)]">
              {lineNumbers.map((num, i) => (
                <div key={i} className="h-5 leading-5">
                  {num}
                </div>
              ))}
            </div>
            <div className="flex-1 py-3 pl-3 pr-4 select-text">
              {lines.map((line, i) => (
                <pre key={i} className="h-5 leading-5 whitespace-pre font-mono text-[var(--code-line-fg)]">
                  {line || " "}
                </pre>
              ))}
            </div>
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <FileTextIcon className="size-7 mb-2" />
          <span className="text-xs font-bold uppercase tracking-wider">Empty file or no content</span>
        </div>
      )}

      {done && content && (
        <CardFooter className="flex items-center justify-between bg-muted/50 px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground select-none">
          <div>
            Showing lines {lineNumbers[0]}-{lineNumbers[lineNumbers.length - 1]}
          </div>
          <div>{lines.length} lines</div>
        </CardFooter>
      )}
    </Card>
  );
}
