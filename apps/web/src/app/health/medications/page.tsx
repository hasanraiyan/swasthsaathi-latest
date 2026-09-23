import { Show, SignIn } from "@clerk/nextjs";
import { MedicationsList } from "@/components/health/medications-list";
import { TodayMedicationSchedule } from "@/components/health/today-medication-schedule";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Same server-side auth gate as the other Health Companion pages.
export default function MedicationsPage() {
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
        <div className="mx-auto w-full max-w-lg p-4 pb-0">
          <TodayMedicationSchedule />
        </div>
        <MedicationsList />
      </Show>
    </>
  );
}
