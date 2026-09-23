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
  /** Compact label for the home dashboard's icon tiles. */
  shortLabel: string;
  /** One-line summary shown under the page title. */
  description: string;
  icon: Icon;
  /** Tailwind classes for the pastel icon tile (bg + ink). */
  tint: string;
}

// Single source of truth for Health Companion navigation — the sidebar, the
// health pages' header, and the home dashboard's section tiles all read from
// this. Phase 1 is complete as of History — Phase 2 (Goals & Actions)
// modules join this array as they're built.
export const HEALTH_NAV_ITEMS: HealthNavItem[] = [
  {
    href: "/health/profile",
    label: "Health Profile",
    shortLabel: "Profile",
    description: "Your basics — height, weight, blood group and more.",
    icon: UserIcon,
    tint: "bg-tint-mint text-tint-mint-foreground",
  },
  {
    href: "/health/conditions",
    label: "Health Conditions",
    shortLabel: "Conditions",
    description: "Ongoing and past conditions you're managing.",
    icon: FirstAidKitIcon,
    tint: "bg-tint-rose text-tint-rose-foreground",
  },
  {
    href: "/health/medications",
    label: "Medications",
    shortLabel: "Medicines",
    description: "What you take, when, and today's doses.",
    icon: PillIcon,
    tint: "bg-tint-lavender text-tint-lavender-foreground",
  },
  {
    href: "/health/measurements",
    label: "Measurements",
    shortLabel: "Vitals",
    description: "Blood pressure, sugar, weight and other readings.",
    icon: ChartLineIcon,
    tint: "bg-tint-peach text-tint-peach-foreground",
  },
  {
    href: "/health/reminders",
    label: "Reminders",
    shortLabel: "Reminders",
    description: "Nudges for check-ups, refills and routines.",
    icon: BellRingingIcon,
    tint: "bg-tint-sand text-tint-sand-foreground",
  },
  {
    href: "/health/reports",
    label: "Medical Reports",
    shortLabel: "Reports",
    description: "Lab results and documents, in one place.",
    icon: FileTextIcon,
    tint: "bg-tint-sky text-tint-sky-foreground",
  },
  {
    href: "/health/history",
    label: "Health History",
    shortLabel: "History",
    description: "A timeline of everything that's happened.",
    icon: ClockCounterClockwiseIcon,
    tint: "bg-tint-mint text-tint-mint-foreground",
  },
];
