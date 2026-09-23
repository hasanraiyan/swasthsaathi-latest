import { Show } from "@clerk/nextjs";
import { MedicalReportsList } from "@/components/health/medical-reports-list";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as the other Health Companion pages.
export default function ReportsPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <MedicalReportsList />
      </Show>
    </>
  );
}
