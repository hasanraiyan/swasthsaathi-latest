"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { BrandLockup } from "@/components/brand/brand";
import { AccountFooter, HealthNavGroup, PrimaryNavGroup } from "@/components/app-shell/nav-groups";

// The sidebar for every page except chat itself — chat's ThreadSidebar
// carries the same Primary + Your Health groups plus its own thread list, so
// navigation looks identical everywhere; this one just has no thread list to
// show.
function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link href="/" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          <BrandLockup />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <PrimaryNavGroup pathname={pathname} />
        <HealthNavGroup pathname={pathname} />
      </SidebarContent>

      <AccountFooter />
    </Sidebar>
  );
}

export { AppSidebar };
