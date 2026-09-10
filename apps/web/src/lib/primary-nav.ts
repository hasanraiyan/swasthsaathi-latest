import type { Icon } from "@phosphor-icons/react";
import { ChatCircleIcon, HouseIcon, SparkleIcon } from "@phosphor-icons/react";

export interface PrimaryNavItem {
  href: string;
  label: string;
  icon: Icon;
  disabled?: boolean;
  disabledReason?: string;
}

// Top-level app sections, separate from the "Your Health" data-type nav
// (lib/health-nav.ts) and from chat's own thread list. "Your Health" already
// covers a health overview/hub, so there's no separate standalone "Health"
// primary link — it would just duplicate that group one level up.
export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/chat", label: "Chat", icon: ChatCircleIcon },
  {
    href: "/insights",
    label: "Insights",
    icon: SparkleIcon,
    disabled: true,
    disabledReason: "Insights — coming soon",
  },
];
