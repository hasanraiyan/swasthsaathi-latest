"use client";

import * as React from "react";
import { CheckCircleIcon, ClockIcon, CircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ItemGroup, Item, ItemMedia, ItemContent } from "@/components/ui/item";
import type { PersonaTodo } from "@personaai/react";

function TodoStatusIcon({ status }: { status: PersonaTodo["status"] }) {
  if (status === "completed") {
    return (
      <CheckCircleIcon weight="fill" className="size-[15px] shrink-0 text-primary" />
    );
  }
  if (status === "in_progress") {
    return <ClockIcon className="size-[15px] shrink-0 text-primary" />;
  }
  return <CircleIcon className="size-[15px] shrink-0 text-muted-foreground/40" />;
}

// Dostify-style plan list: bare, tightly-spaced rows — no bordered cards, no
// progress bar. Completed steps strike through and fade; the in-progress step
// is semibold; pending steps stay quiet.
function TodoChecklist({
  todos,
  className,
}: {
  todos: PersonaTodo[];
  className?: string;
}) {
  if (!todos?.length) return null;

  return (
    <ItemGroup className={cn("gap-0", className)}>
      {todos.map((todo, i) => {
        const isCompleted = todo.status === "completed";
        const isInProgress = todo.status === "in_progress";

        return (
          <Item key={i} variant="default" size="sm" className="gap-2 rounded-none py-1">
            <ItemMedia variant="icon" className="mt-px self-start bg-transparent">
              <TodoStatusIcon status={todo.status} />
            </ItemMedia>
            <ItemContent>
              <span
                className={cn(
                  "wrap-break-word text-xs leading-5",
                  isCompleted
                    ? "text-muted-foreground/70 line-through"
                    : isInProgress
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {todo.content}
              </span>
            </ItemContent>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

export { TodoChecklist, TodoStatusIcon };
