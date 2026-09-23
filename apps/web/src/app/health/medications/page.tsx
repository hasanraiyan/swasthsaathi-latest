import { Show } from "@clerk/nextjs";
import { MedicationsList } from "@/components/health/medications-list";
import { TodayMedicationSchedule } from "@/components/health/today-medication-schedule";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as the other Health Companion pages.
export default function MedicationsPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <div className="mx-auto w-full max-w-2xl p-4 pb-0">
          <TodayMedicationSchedule />
        </div>
        <MedicationsList />
      </Show>
    </>
  );
}
