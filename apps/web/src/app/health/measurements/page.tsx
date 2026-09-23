import { Show } from "@clerk/nextjs";
import { HealthMeasurementsList } from "@/components/health/health-measurements-list";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as the other Health Companion pages.
export default function HealthMeasurementsPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <HealthMeasurementsList />
      </Show>
    </>
  );
}
