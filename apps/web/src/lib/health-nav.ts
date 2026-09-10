import type { Icon } from "@phosphor-icons/react";
import { FirstAidKitIcon, PillIcon, UserIcon } from "@phosphor-icons/react";

export interface HealthNavItem {
  href: string;
  label: string;
  icon: Icon;
}

// Single source of truth for Health Companion navigation — the sidebar (and
// later, a dashboard "explore" list) both read from this. Only list a route
// once its page actually exists; Phase 1's other modules (measurements,
// reminders, history) join this array as they're built rather than linking
// ahead to pages that don't exist yet.
export const HEALTH_NAV_ITEMS: HealthNavItem[] = [
  { href: "/health/profile", label: "Health Profile", icon: UserIcon },
  { href: "/health/conditions", label: "Health Conditions", icon: FirstAidKitIcon },
  { href: "/health/medications", label: "Medications", icon: PillIcon },
];
