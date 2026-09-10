import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

// Health Companion pages don't carry the chat sidebar/thread list (that stays
// scoped to "/" per the current shell) — this is the minimal way back until
// there's a real shared app shell across chat and Health routes.
export default function HealthLayout({ children }: LayoutProps<"/health">) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b p-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon /> Back to chat
        </Link>
      </div>
      {children}
    </div>
  );
}
