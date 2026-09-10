import { ChartLineIcon, FileTextIcon, PillIcon, ThermometerIcon } from "@phosphor-icons/react";
import type { ChatStarterPrompt } from "@/components/persona/chat/chat-empty-state";

// The home/landing state's quick actions — rendered as ChatEmptyState's
// starter-prompt pills, which already prefill (not auto-send) the composer.
export const CHAT_STARTER_PROMPTS: ChatStarterPrompt[] = [
  {
    label: "Understand a symptom",
    icon: ThermometerIcon,
    template: "I don't feel well. Can you help me understand what might be going on?",
  },
  {
    label: "My medicines",
    icon: PillIcon,
    template: "Can you help me review my medicines?",
  },
  {
    label: "My measurements",
    icon: ChartLineIcon,
    template: "Can you help me understand my recent health measurements?",
  },
  {
    label: "Explain a health report",
    icon: FileTextIcon,
    template: "I have a health report I'd like help understanding.",
  },
];
