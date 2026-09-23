import { Show } from "@clerk/nextjs";
import { HealthProfileForm } from "@/components/health/health-profile-form";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as app/page.tsx (Show is an async Server
// Component; SignedIn/SignedOut throw at runtime on this Clerk version).
export default function HealthProfilePage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <HealthProfileForm />
      </Show>
    </>
  );
}
