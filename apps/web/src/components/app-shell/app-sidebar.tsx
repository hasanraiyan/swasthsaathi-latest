"use client";

import { usePathname } from "next/navigation";
import { HeartbeatIcon } from "@phosphor-icons/react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar";
import { AccountFooter, HealthNavGroup, PrimaryNavGroup } from "@/components/app-shell/nav-groups";

// The sidebar for every page except chat itself — chat's ThreadSidebar
// carries the same Primary + Your Health groups plus its own thread list, so
// navigation looks identical everywhere; this one just has no thread list to
// show.
function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1.5 py-1 text-sm font-medium text-sidebar-foreground">
          <HeartbeatIcon className="size-4 text-primary" weight="fill" />
          SwasthyaSaathi
        </div>
      </SidebarHeader>

      <SidebarContent>
        <PrimaryNavGroup pathname={pathname} />
        <SidebarSeparator />
        <HealthNavGroup pathname={pathname} />
      </SidebarContent>

      <AccountFooter />
    </Sidebar>
  );
}

export { AppSidebar };
