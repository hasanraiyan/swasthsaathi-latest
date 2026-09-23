import { Show } from "@clerk/nextjs";
import { HealthConditionsList } from "@/components/health/health-conditions-list";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as app/page.tsx and app/health/profile/page.tsx.
export default function HealthConditionsPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <HealthConditionsList />
      </Show>
    </>
  );
}
