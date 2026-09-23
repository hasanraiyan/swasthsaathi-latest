import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { HealthTopBar } from "@/components/app-shell/health-top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Now shares the same sidebar shell as Home (see components/app-shell) —
// navigation looks and works the same everywhere except chat, which has its
// own ThreadSidebar carrying the same Primary/Your Health groups plus a
// thread list.
//
// One scroll container for the whole page (not one per section card), so a
// page with several stacked sections — Medications has today's schedule
// above the list — scrolls as a single column under the sticky top bar.
export default function HealthLayout({ children }: LayoutProps<"/health">) {
  return (
    <SidebarProvider className="flex min-h-0 flex-1">
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-col">
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-8">
          <HealthTopBar />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
