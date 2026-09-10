import type { Icon } from "@phosphor-icons/react";
import { BellRingingIcon, ChartLineIcon, FirstAidKitIcon, PillIcon, UserIcon } from "@phosphor-icons/react";

export interface HealthNavItem {
  href: string;
  label: string;
  icon: Icon;
}

// Single source of truth for Health Companion navigation — the sidebar (and
// later, a dashboard "explore" list) both read from this. Only list a route
// once its page actually exists; Phase 1's remaining module (Basic Health
// History) joins this array once it's built.
export const HEALTH_NAV_ITEMS: HealthNavItem[] = [
  { href: "/health/profile", label: "Health Profile", icon: UserIcon },
  { href: "/health/conditions", label: "Health Conditions", icon: FirstAidKitIcon },
  { href: "/health/medications", label: "Medications", icon: PillIcon },
  { href: "/health/measurements", label: "Measurements", icon: ChartLineIcon },
  { href: "/health/reminders", label: "Reminders", icon: BellRingingIcon },
];
