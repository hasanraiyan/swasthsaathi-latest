"use client";

import * as React from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { tryParseJson } from "./utils";
import { JsonTreeView } from "./json-tree-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A labeled "Input" / "Result" panel: a collapsible JSON tree (falls back to
 * plain text for non-JSON results), with a copy-to-clipboard button. Renders
 * the full tree with no height cap - nodes collapse individually instead of
 * the whole panel scrolling.
 */
export function RequestResponsePanel({
  label,
  text,
  isError,
  className,
}: {
  label: string;
  text: string | undefined;
  isError?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const parsed = tryParseJson(text);
  const isJson = parsed !== null && typeof parsed === "object";

  if (!text) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isJson ? JSON.stringify(parsed, null, 2) : text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — nothing to surface, the button just won't flip
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground">{label}</div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label={copied ? "Copied" : `Copy ${label}`}
                onClick={handleCopy}
                className="h-5 gap-1 px-1.5 text-[10px] font-semibold"
              >
                {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            }
          />
          <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
      </div>
      <Card className={cn("gap-0 rounded-none py-0", isError ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted", className)}>
        <CardContent className="p-0">
          <ScrollArea className="max-h-40">
            <div className="p-2">
              {isJson ? (
                <JsonTreeView data={parsed} />
              ) : (
                <div
                  className={cn(
                    "whitespace-pre-wrap break-words font-mono text-xs leading-relaxed",
                    isError ? "text-destructive" : "text-foreground"
                  )}
                >
                  {text}
                </div>
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
