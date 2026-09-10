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
import type { PersonaWorkspaceFile } from "@personaai/react";

const CODE_EXTENSIONS = [
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java",
  "c", "cpp", "h", "hpp", "cs", "php", "sh", "bash", "zsh", "sql", "json",
  "yaml", "yml", "toml", "html", "css", "scss",
];

function isCodeFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CODE_EXTENSIONS.includes(ext);
}

/** Compare two workspace paths ignoring the prefix an agent may or may not
 * include: `/workspace/outputs/a.py`, `workspace/outputs/a.py`, `./outputs/a.py`
 * and `outputs/a.py` are all the same file. */
function normalizePath(p: string): string {
  return p
    .replace(/^\.?\//, "")
    .replace(/^workspace\//, "")
    .replace(/^\.\//, "");
}

/**
 * Resolve a presented path against the workspace snapshot.
 *
 * The snapshot is keyed by whatever the agent's own state used, while a
 * `present_file` call (and the Open button on its card) carries the path the
 * tool was given — the two routinely disagree by a `/workspace` prefix, which
 * is why clicking Open used to land on "Not in the workspace snapshot" for a
 * file that was plainly there. Try the exact key, then a prefix-insensitive
 * match, then a basename match (only when unambiguous — two `index.ts` files
 * in different folders must not silently resolve to the wrong one).
 */
function resolveContent(
  files: Record<string, PersonaWorkspaceFile>,
  path: string
): string | undefined {
  if (!path) return undefined;
  const exact = files[path];
  if (exact?.content != null) return exact.content;

  const target = normalizePath(path);
  for (const [key, file] of Object.entries(files)) {
    if (normalizePath(key) === target) return file.content;
  }

  const base = target.split("/").pop();
  if (!base) return undefined;
  const byBase = Object.entries(files).filter(
    ([key]) => key.split("/").pop() === base
  );
  return byBase.length === 1 ? byBase[0][1].content : undefined;
}

/**
 * Slide-over preview of a workspace file.
 *
 * Opened only by the user — either the Open button on a `present_file` tool
 * card, or a click on a workspace path inside a tool card. Deliberately NOT
 * driven by `useChat().presentedFile`: the SDK sets that on its own the
 * moment a `present_file` call succeeds, which flung the panel open under the
 * user mid-conversation. Opening is the user's choice, so the caller owns the
 * path and this stays a dumb renderer.
 */
function PresentedFileSheet({
  path,
  files,
  onOpenChange,
}: {
  /** Path to preview, or null when closed. */
  path: string | null;
  /** useChat().files — the state-backed workspace snapshot. */
  files: Record<string, PersonaWorkspaceFile>;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const filePath = path ?? "";
  const FileIcon = isCodeFile(filePath) ? FileCodeIcon : FileTextIcon;
  const displayName = filePath.split("/").pop() || filePath;

  const content = React.useMemo(
    () => (path ? resolveContent(files, path) : undefined),
    [files, path]
  );

  const lines = React.useMemo(() => {
    if (content == null) return [];
    const raw = content.split("\n");
    // A trailing newline would render one empty gutter row past the last line.
    if (raw.length > 1 && raw[raw.length - 1] === "") raw.pop();
    return raw;
  }, [content]);

  return (
    <Sheet open={path !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full sm:max-w-2xl data-[side=bottom]:min-h-[60%] data-[side=bottom]:max-h-[85vh]"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 min-w-0">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-mono text-sm">{displayName}</span>
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">
            {filePath}
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
                No content available
              </span>
              <span className="text-xs">
                This file isn&apos;t in the workspace snapshot for this
                conversation — it may have been deleted since, or written by a
                run whose state wasn&apos;t recorded.
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { PresentedFileSheet };
