"use client";

import * as React from "react";
import type { PersonaThread } from "@personaai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/ui/item";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { PlusIcon, TrashIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function ThreadRow({
  thread,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  thread: PersonaThread;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(thread.title ?? "");

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== thread.title) onRename(trimmed);
    setEditing(false);
  };

  return (
    <Item
      variant={active ? "muted" : "default"}
      size="sm"
      className={cn("cursor-pointer", !editing && "group/thread")}
      onClick={editing ? undefined : onSelect}
    >
      <ItemContent>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={commitRename}
            className="h-6 px-1.5 text-xs"
          />
        ) : (
          <ItemTitle>{thread.title || "New chat"}</ItemTitle>
        )}
      </ItemContent>

      {!editing && (
        <ItemActions className="opacity-0 group-hover/thread:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Rename thread"
            onClick={(e) => {
              e.stopPropagation();
              setDraft(thread.title ?? "");
              setEditing(true);
            }}
          >
            <PencilSimpleIcon />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete thread"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <TrashIcon />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{thread.title || "New chat"}&quot; and its messages will be
                  permanently deleted. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ItemActions>
      )}
    </Item>
  );
}

function ThreadSidebar({
  threads,
  activeThreadId,
  isLoading,
  error,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
}: {
  threads: PersonaThread[];
  activeThreadId: string | null;
  isLoading?: boolean;
  error?: Error | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => void;
  onRenameThread: (id: string, title: string) => void;
  onDeleteThread: (id: string) => void;
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border">
      <div className="p-2">
        <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={onCreateThread}>
          <PlusIcon /> New chat
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-0">
        {isLoading ? (
          <div className="p-2 text-xs text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="p-2 text-xs text-destructive">
            Couldn&apos;t load chats: {error.message}
          </div>
        ) : threads.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground">No chats yet.</div>
        ) : (
          threads.map((thread) => (
            <ThreadRow
              key={thread._id}
              thread={thread}
              active={thread._id === activeThreadId}
              onSelect={() => onSelectThread(thread._id)}
              onRename={(title) => onRenameThread(thread._id, title)}
              onDelete={() => onDeleteThread(thread._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { ThreadSidebar };
