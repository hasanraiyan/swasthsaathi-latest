import { Show } from "@clerk/nextjs";
import { HealthHistoryTimeline } from "@/components/health/health-history-timeline";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as the other Health Companion pages.
export default function HealthHistoryPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <HealthHistoryTimeline />
      </Show>
    </>
  );
}
