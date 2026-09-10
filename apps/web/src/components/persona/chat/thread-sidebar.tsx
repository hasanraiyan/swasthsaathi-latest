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
      size="sm"
      // Row padding is overridden rather than inherited from `size="sm"`. That
      // variant's `py-2.5`/`px-3` is a comfortable menu-row rhythm, but a thread
      // list is a dense index — 10px above and 10px below every title reads as
      // a gap *between* rows rather than padding inside them.
      //
      // The active fill is set here as an opaque token rather than left to the
      // `muted` variant: that variant paints `bg-muted/50`, and the row actions
      // (which now float *over* the title) need a mask that fully hides the
      // text beneath them. Translucent would let the title show through the
      // buttons. `relative` is what makes the actions' `absolute` resolve
      // against this row.
      className={cn(
        "relative w-full min-w-0 cursor-pointer px-2 py-1.5",
        active && "bg-sidebar-accent",
        !editing && "group/thread"
      )}
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
          // title would run past the row instead of ellipsing. The row is the
          // title's to fill now that the actions float over it.
          <ItemTitle className="w-full min-w-0 truncate">
            {thread.title || "New chat"}
          </ItemTitle>
        )}
      </ItemContent>

      {!editing && (
        // Floating, not a column of their own: the title keeps the whole row
        // to truncate across, and these ride over its tail instead of pushing
        // it short. The gradient is the mask — it goes from the row's own
        // colour at the right edge to transparent at the left, so the title
        // appears to fade out under the buttons rather than being cut off.
        //
        // Touch devices have no hover, so a live row shows its actions
        // permanently and a hovered one reveals them. While hidden they are
        // `pointer-events-none` too — `opacity-0` alone still leaves them
        // clickable, so the right edge of every row would swallow taps meant
        // for the row itself. Focus-within covers the keyboard path, where
        // tabbing to an invisible button would otherwise be a dead stop.
        <ItemActions
          className={cn(
            "absolute inset-y-0 right-0 gap-0.5 pr-1 pl-8",
            "bg-gradient-to-l to-transparent",
            active
              ? "from-sidebar-accent via-sidebar-accent"
              : "from-sidebar via-sidebar",
            "transition-opacity",
            active
              ? "opacity-100"
              : "pointer-events-none opacity-0 group-hover/thread:pointer-events-auto group-hover/thread:opacity-100 group-focus-within/thread:pointer-events-auto group-focus-within/thread:opacity-100"
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

      <SidebarContent className="gap-0.5 p-1.5">
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
