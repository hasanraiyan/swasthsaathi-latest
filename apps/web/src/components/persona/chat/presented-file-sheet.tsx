"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FileCodeIcon, FileTextIcon } from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PersonaPresentedFile } from "@personaai/react";

const CODE_EXTENSIONS = [
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java",
  "c", "cpp", "h", "hpp", "cs", "php", "sh", "bash", "zsh", "sql", "json",
  "yaml", "yml", "toml", "html", "css", "scss",
];

function isCodeFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CODE_EXTENSIONS.includes(ext);
}

/**
 * Slide-over preview of the file the agent highlighted with its `present_file`
 * tool (or that the user clicked in a tool card, via `openWorkspaceFile`).
 *
 * Neither `useChat`'s `presentedFile` nor `dismissPresentedFile` had a
 * renderer before this: the agent could present a file, or a click on a
 * workspace path could set one, and the state changed with nothing on screen
 * to show for it. Content comes from `useChat().files` — the state-backed
 * workspace snapshot keyed by path — because `presentedFile` itself carries
 * only path/title/description.
 */
function PresentedFileSheet({
  presentedFile,
  content,
  onOpenChange,
}: {
  presentedFile: PersonaPresentedFile | null;
  /** From useChat().files[path]?.content — absent when the presented path
   * isn't in the workspace snapshot (an upload, or a file since deleted). */
  content?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const path = presentedFile?.path ?? "";
  const FileIcon = isCodeFile(path) ? FileCodeIcon : FileTextIcon;

  const lines = React.useMemo(() => {
    if (!content) return [];
    const raw = content.split("\n");
    // A trailing newline would render one empty gutter row past the last line.
    if (raw.length > 1 && raw[raw.length - 1] === "") raw.pop();
    return raw;
  }, [content]);

  return (
    <Sheet open={presentedFile !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full sm:max-w-2xl data-[side=bottom]:min-h-[60%] data-[side=bottom]:max-h-[85vh]"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 min-w-0">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-mono text-sm">
              {presentedFile?.title || path}
            </span>
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">
            {presentedFile?.description || path}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {lines.length > 0 ? (
            <div className="h-full overflow-auto bg-[#0D1117] font-mono text-[11.5px] text-[#C9D1D9]">
              <div className="flex min-w-full">
                <div className="w-10 shrink-0 select-none border-r border-[#30363D] bg-[#161B22]/50 py-3 pr-3 text-right text-[10px] font-bold text-[#8B949E]">
                  {lines.map((_, i) => (
                    <div key={i} className="h-5 leading-5">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 overflow-x-auto py-3 pl-3 pr-4 select-text">
                  {lines.map((line, i) => (
                    <pre
                      key={i}
                      className="h-5 leading-5 whitespace-pre font-mono text-[#E6EDF2]"
                    >
                      {line || " "}
                    </pre>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-muted-foreground">
              <FileTextIcon className="size-7" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Not in the workspace snapshot
              </span>
              <span className="text-xs">
                This path wasn&apos;t written by the agent in this conversation,
                so there&apos;s no content to preview.
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { PresentedFileSheet };
