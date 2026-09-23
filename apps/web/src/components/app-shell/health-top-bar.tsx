"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HEALTH_NAV_ITEMS } from "@/lib/health-nav";
import { cn } from "@/lib/utils";

/**
 * Top bar for the /health/* pages: back-to-home, the section's tinted icon
 * and its name. The section cards below keep their own titles + actions;
 * this just tells you where you are and how to get back.
 */
function HealthTopBar() {
  const pathname = usePathname();
  const section = HEALTH_NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const SectionIcon = section?.icon;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:px-5">
      <SidebarTrigger className="md:hidden" />
      <Link
        href="/"
        aria-label="Back to home"
        className="flex size-8 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeftIcon className="size-4.5" weight="bold" />
      </Link>
      {section && SectionIcon ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", section.tint)}>
            <SectionIcon className="size-4.5" weight="duotone" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm leading-tight font-bold">{section.label}</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">{section.description}</div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export { HealthTopBar };
