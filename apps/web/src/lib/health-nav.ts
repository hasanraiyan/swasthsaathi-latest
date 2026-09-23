import type { Icon } from "@phosphor-icons/react";
import {
  BellRingingIcon,
  ChartLineIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  FirstAidKitIcon,
  PillIcon,
  UserIcon,
} from "@phosphor-icons/react";

export interface HealthNavItem {
  href: string;
  label: string;
  icon: Icon;
}

// Single source of truth for Health Companion navigation — the sidebar (and
// later, a dashboard "explore" list) both read from this. Phase 1 is
// complete as of History — Phase 2 (Goals & Actions) modules join this array
// as they're built.
export const HEALTH_NAV_ITEMS: HealthNavItem[] = [
  { href: "/health/profile", label: "Health Profile", icon: UserIcon },
  { href: "/health/conditions", label: "Health Conditions", icon: FirstAidKitIcon },
  { href: "/health/medications", label: "Medications", icon: PillIcon },
  { href: "/health/measurements", label: "Measurements", icon: ChartLineIcon },
  { href: "/health/reminders", label: "Reminders", icon: BellRingingIcon },
  { href: "/health/reports", label: "Medical Reports", icon: FileTextIcon },
  { href: "/health/history", label: "Health History", icon: ClockCounterClockwiseIcon },
];
