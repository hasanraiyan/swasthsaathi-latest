import { Show, SignIn } from "@clerk/nextjs";
import { HealthMeasurementsList } from "@/components/health/health-measurements-list";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Same server-side auth gate as the other Health Companion pages.
export default function HealthMeasurementsPage() {
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
        <HealthMeasurementsList />
      </Show>
    </>
  );
}
