"use client";

import * as React from "react";
import type { PersonaThread } from "@personaai/react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle, ItemActions } from "@/components/ui/item";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusIcon,
  TrashIcon,
  PencilSimpleIcon,
  GearIcon,
} from "@phosphor-icons/react";
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
      className={cn("w-full min-w-0 cursor-pointer", !editing && "group/thread")}
      onClick={editing ? undefined : onSelect}
    >
      <ItemContent className="min-w-0">
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
          // `w-full` overrides the primitive's own `w-fit`. With `w-fit` a
          // long title sizes the element to its content instead of to the
          // available width, so `truncate` has no overflow to clip and the
          // title runs under the row actions instead of ellipsing.
          <ItemTitle className="w-full min-w-0 truncate">
            {thread.title || "New chat"}
          </ItemTitle>
        )}
      </ItemContent>

      {!editing && (
        // Touch devices have no hover, so the row actions can't be
        // hover-revealed alone — they're always present once the row is
        // active, and hover-revealed otherwise.
        <ItemActions
          className={cn(
            "shrink-0 transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover/thread:opacity-100"
          )}
        >
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

/**
 * The thread list, as a real off-canvas sidebar.
 *
 * It used to be a bare `<div className="w-64 shrink-0">`, which meant it sat
 * permanently in the layout at every width — on a phone that spent 256 of
 * ~390 usable pixels on a list nobody could dismiss, leaving the conversation
 * in a sliver. The `Sidebar` primitive (shadcn) already owns the whole
 * problem: it renders a fixed panel with a gap on desktop and a dismissible
 * Sheet on mobile, and persists the collapsed state in a cookie.
 *
 * The footer is the other half of that primitive being unused — the app had
 * no visible account affordance at all. Clerk's own UserButton covers it
 * (avatar, name, and the sign-out/manage-account menu it already ships), with
 * a settings button beside it that is inert for now.
 */
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
  // On mobile the sidebar is a Sheet. Choosing a thread (or starting one)
  // resolves the user's intent, so it has to close — otherwise the sheet stays
  // over the conversation the user just asked for, and there is no visible
  // close button to get out of it (the Sheet's own is suppressed by the
  // Sidebar primitive's mobile styling).
  const { isMobile, setOpenMobile } = useSidebar();
  const closeIfMobile = React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const handleSelect = (id: string) => {
    onSelectThread(id);
    closeIfMobile();
  };

  const handleCreate = () => {
    onCreateThread();
    closeIfMobile();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleCreate}
        >
          <PlusIcon /> New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="gap-1 p-2">
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
              onSelect={() => handleSelect(thread._id)}
              onRename={(title) => onRenameThread(thread._id, title)}
              onDelete={() => onDeleteThread(thread._id)}
            />
          ))
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex min-w-0 items-center gap-1">
          {/* showName so the account is identifiable at a glance rather than
              being just an unlabelled avatar; truncation is handled below
              because a long email will otherwise push the settings button off
              the panel. */}
          <div className="min-w-0 flex-1">
            <UserButton
              showName
              appearance={{
                elements: {
                  rootBox: "min-w-0 w-full",
                  userButtonBox: "min-w-0 w-full",
                  userButtonOuterIdentifier:
                    "min-w-0 truncate text-xs text-sidebar-foreground",
                },
              }}
            />
          </div>

          {/* Inert by design — the settings surface doesn't exist yet. The
              tooltip is what keeps that honest: an enabled-looking button that
              silently swallowed clicks would read as broken rather than
              unbuilt. The span is the trigger because a disabled button emits
              no pointer events for the tooltip to hook. */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label="Settings"
              >
                <GearIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Settings — coming soon</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { ThreadSidebar };
