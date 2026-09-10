import type { Icon } from "@phosphor-icons/react";
import { HouseIcon, SparkleIcon } from "@phosphor-icons/react";

export interface PrimaryNavItem {
  href: string;
  label: string;
  icon: Icon;
  disabled?: boolean;
  disabledReason?: string;
}

// Top-level app sections, separate from the "Your Health" data-type nav
// (lib/health-nav.ts) and chat's own thread list. "Home" IS the chat surface
// (/ renders ChatApp — its own empty state doubles as the dashboard), so
// there's no separate "Chat" entry duplicating it.
export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { href: "/", label: "Home", icon: HouseIcon },
  {
    href: "/insights",
    label: "Insights",
    icon: SparkleIcon,
    disabled: true,
    disabledReason: "Insights — coming soon",
  },
];
