import { Show, SignIn } from "@clerk/nextjs";
import { MedicationsList } from "@/components/health/medications-list";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Same server-side auth gate as the other Health Companion pages.
export default function MedicationsPage() {
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
        <MedicationsList />
      </Show>
    </>
  );
}
