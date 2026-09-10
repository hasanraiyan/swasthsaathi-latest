import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Now shares the same sidebar shell as Home (see components/app-shell) —
// navigation looks and works the same everywhere except chat, which has its
// own ThreadSidebar carrying the same Primary/Your Health groups plus a
// thread list.
export default function HealthLayout({ children }: LayoutProps<"/health">) {
  return (
    <SidebarProvider className="flex min-h-0 flex-1">
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-col">
        <div className="p-2">
          <SidebarTrigger className="md:hidden" />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
