import { Show, SignIn } from "@clerk/nextjs";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { Empty, EmptyContent } from "@/components/ui/empty";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Show is an async Server Component (Clerk Core 3 — SignedIn/SignedOut throw
// at runtime in this version), so the auth gate has to live here rather than
// in a client component.
export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <Empty className="flex-1">
          <EmptyContent>
            <SignIn />
          </EmptyContent>
        </Empty>
      </Show>
      <Show when="signed-in">
        <SidebarProvider className="flex min-h-0 flex-1">
          <AppSidebar />
          <SidebarInset className="flex min-h-0 flex-col">
            <div className="p-2">
              <SidebarTrigger className="md:hidden" />
            </div>
            <HomeDashboard />
          </SidebarInset>
        </SidebarProvider>
      </Show>
    </>
  );
}
