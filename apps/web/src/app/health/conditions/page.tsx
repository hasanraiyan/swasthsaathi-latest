import { Show, SignIn } from "@clerk/nextjs";
import { HealthConditionsList } from "@/components/health/health-conditions-list";
import { Empty, EmptyContent } from "@/components/ui/empty";

// Same server-side auth gate as app/page.tsx and app/health/profile/page.tsx.
export default function HealthConditionsPage() {
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
        <HealthConditionsList />
      </Show>
    </>
  );
}
