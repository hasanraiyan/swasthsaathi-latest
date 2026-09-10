import type { PersonaMessage, PersonaWorkspaceFile } from "@personaai/react";
import { parseToolArgs } from "@/components/persona/chat/tool-cards/utils";

/**
 * The workspace, as a plain path -> content map.
 *
 * `useChat().files` is NOT a dependable source. In the SDK it is written from
 * exactly two places — `normalizeWorkspaceFiles(data?.state?.files ?? {})` on
 * thread load (dist/index.js:492) and `normalizeWorkspaceFiles(event.snapshot
 * .files)` on a live `STATE_SNAPSHOT` (dist/index.js:831). An agent that emits
 * no snapshot therefore leaves it `{}` for the whole conversation, which is
 * why the preview landed on "No content available" even for a file the agent
 * had just written a moment earlier.
 *
 * The content was never actually missing. It is in the transcript, and always
 * has been: `write_file` carries the entire file body in its arguments (the
 * very arguments `diff-view.tsx` already renders a full diff from),
 * `edit_file` carries the old and new spans, and `read_file` hands the file
 * back in its result. Replaying those in order rebuilds the workspace from the
 * one source that is present in every conversation.
 */
export type Workspace = Record<string, string>;

const PATH_KEYS = [
  "file_path",
  "filePath",
  "path",
  "filename",
  "fileName",
  "targetFile",
  "target_file",
];

function pathOf(args: Record<string, unknown>): string {
  for (const key of PATH_KEYS) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function isWriteTool(name: string): boolean {
  return name === "write_file" || name === "create_file";
}

function isEditTool(name: string): boolean {
  return name === "edit_file" || name === "str_replace" || name === "str_replace_editor";
}

function isReadTool(name: string): boolean {
  return name === "read_file" || name === "view_file";
}

/**
 * Pull a whole-file body out of a `read_file` result, or null when the result
 * can't be trusted to be the whole file.
 *
 * A ranged read (offset/limit) returns only a slice, and rendering a slice as
 * if it were the file would be a worse lie than showing no preview at all — so
 * any range argument disqualifies the result outright.
 */
function readResultContent(
  args: Record<string, unknown>,
  result: string | undefined
): string | null {
  if (!result) return null;
  for (const key of ["offset", "limit", "start_line", "end_line", "startLine", "endLine"]) {
    if (args[key] != null) return null;
  }

  try {
    const parsed = JSON.parse(result) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return typeof parsed.content === "string" ? parsed.content : null;
    }
  } catch {
    // Not JSON — the raw result is the file body.
  }
  return result;
}

/**
 * Replay every file-mutating tool call in the conversation, in order.
 *
 * Order is the whole point: a `write_file` followed by three `edit_file`s
 * resolves to the file as it stands now, not to whichever call happened to be
 * visited last. Reads seed the map only where nothing has written yet — a
 * write is a recorded mutation, a read is a mere observation of one.
 *
 * An `edit_file` whose `old_string` we never saw (the file was written in an
 * earlier conversation, or by a run whose writes aren't in this transcript)
 * leaves the path unresolved rather than storing the edited fragment as though
 * it were the file. A missing preview is honest; a fragment misrepresented as
 * the whole file is not.
 */
export function buildWorkspaceFromMessages(messages: PersonaMessage[]): Workspace {
  const workspace: Workspace = {};

  for (const message of messages) {
    for (const toolCall of message.toolCalls ?? []) {
      if (!toolCall.toolName || toolCall.isError) continue;
      const name = toolCall.toolName.toLowerCase();
      const args = parseToolArgs(toolCall.args) ?? {};
      const path = pathOf(args);
      if (!path) continue;

      if (isWriteTool(name)) {
        if (typeof args.content === "string") workspace[path] = args.content;
        continue;
      }

      if (isEditTool(name)) {
        const oldString = typeof args.old_string === "string" ? args.old_string : null;
        const newString = typeof args.new_string === "string" ? args.new_string : null;
        const previous = workspace[path];
        if (previous == null || newString == null) continue;
        if (oldString == null || oldString === "") continue;
        workspace[path] = args.replace_all
          ? previous.split(oldString).join(newString)
          : previous.replace(oldString, newString);
        continue;
      }

      if (isReadTool(name) && workspace[path] == null) {
        const content = readResultContent(args, toolCall.result);
        if (content != null) workspace[path] = content;
      }
    }
  }

  return workspace;
}

/**
 * Flatten the SDK's snapshot into the same shape, so both sources can be
 * resolved against by one algorithm.
 */
export function workspaceFromSnapshot(
  files: Record<string, PersonaWorkspaceFile>
): Workspace {
  const workspace: Workspace = {};
  for (const [path, file] of Object.entries(files)) {
    if (file?.content != null) workspace[path] = file.content;
  }
  return workspace;
}

/**
 * Split a workspace path into its meaningful segments, dropping the leading
 * `./`, `/`, and `workspace/` that agents include inconsistently:
 * `/workspace/outputs/a.py`, `workspace/outputs/a.py`, `./outputs/a.py` and
 * `outputs/a.py` all reduce to `["outputs", "a.py"]`.
 */
export function segments(path: string): string[] {
  let out = path.trim().replace(/\\/g, "/");
  // Any run of dots/slashes at the front is relative-path noise.
  out = out.replace(/^(?:\.{1,2}\/|\/)+/, "");
  // Drop the `workspace/` container the virtual root lives under — it is
  // present on some paths and absent on others for the same file.
  out = out.replace(/^workspace\//, "");
  return out.split("/").filter(Boolean);
}

/**
 * Find the content for a presented path.
 *
 * Two sources have to be reconciled, and this is the part that used to fail
 * silently: the map is keyed by whatever the transcript (or the snapshot) used
 * as a path, while the path handed to us comes from the `present_file` call's
 * own `filePath` argument. Those routinely disagree by a `/workspace` prefix
 * or a `./`, so a plain `map[path]` lookup misses a file that is plainly
 * there.
 *
 * Tiered, most specific first:
 *   1. exact key — the common case, costs nothing
 *   2. equal segment lists — absorbs `./`, `/`, and `workspace/` differences
 *   3. longest shared segment suffix — absorbs a differing leading directory
 *      (e.g. `/workspace/out/a.py` vs `sandbox/out/a.py`). Ties are refused
 *      rather than guessed: two different `out/a.py` files must not silently
 *      resolve to the wrong one.
 */
export function resolveWorkspaceFile(
  workspace: Workspace,
  path: string
): string | undefined {
  if (!path) return undefined;

  const exact = workspace[path];
  if (exact != null) return exact;

  const target = segments(path);
  if (target.length === 0) return undefined;

  let best: { depth: number; content: string; ties: number } | null = null;

  for (const [key, content] of Object.entries(workspace)) {
    if (content == null) continue;
    const keySegments = segments(key);

    if (keySegments.length === target.length && keySegments.join("/") === target.join("/")) {
      return content;
    }

    const depth = Math.min(keySegments.length, target.length);
    if (depth === 0) continue;
    // Compare only the trailing `depth` segments.
    if (keySegments.slice(-depth).join("/") !== target.slice(-depth).join("/")) continue;

    if (!best || depth > best.depth) {
      best = { depth, content, ties: 0 };
    } else if (depth === best.depth) {
      best.ties += 1;
    }
  }

  return best && best.ties === 0 ? best.content : undefined;
}

/**
 * The full workspace for a conversation: the snapshot where it has the file,
 * the replayed transcript everywhere else.
 *
 * The snapshot wins on a key both sources know, because it is a direct read of
 * the agent's state rather than a reconstruction from arguments. It is the
 * gap-filler that makes this work: in the case that motivated all of this the
 * snapshot is empty, so the replay supplies everything.
 */
export function buildWorkspace(
  messages: PersonaMessage[],
  files: Record<string, PersonaWorkspaceFile>
): Workspace {
  const fromMessages = buildWorkspaceFromMessages(messages);
  const merged: Workspace = { ...fromMessages };
  for (const [path, content] of Object.entries(workspaceFromSnapshot(files))) {
    merged[path] = content;
  }
  return merged;
}
