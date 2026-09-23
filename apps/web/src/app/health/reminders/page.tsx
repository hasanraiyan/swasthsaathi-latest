import { Show } from "@clerk/nextjs";
import { RemindersList } from "@/components/health/reminders-list";
import { SignedOutScreen } from "@/components/brand/signed-out-screen";

// Same server-side auth gate as the other Health Companion pages.
export default function RemindersPage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutScreen />
      </Show>
      <Show when="signed-in">
        <RemindersList />
      </Show>
    </>
  );
}
