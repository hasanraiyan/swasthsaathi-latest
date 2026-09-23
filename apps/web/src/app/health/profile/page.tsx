import { Show, SignIn } from "@clerk/nextjs";
import { HealthProfileForm } from "@/components/health/health-profile-form";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Same server-side auth gate as app/page.tsx (Show is an async Server
// Component; SignedIn/SignedOut throw at runtime on this Clerk version).
export default function HealthProfilePage() {
  return (
    <>
      <Show when="signed-out">
        <Empty className="flex-1">
          <EmptyContent>
            <SignIn routing="hash" />
          </EmptyContent>
        </Empty>
      </Show>
      <Show when="signed-in">
        <HealthProfileForm />
      </Show>
    </>
  );
}
