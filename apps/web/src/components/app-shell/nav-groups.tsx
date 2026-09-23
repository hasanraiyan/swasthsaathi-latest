"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GearIcon } from "@phosphor-icons/react";
import { HEALTH_NAV_ITEMS } from "@/lib/health-nav";
import { PRIMARY_NAV_ITEMS } from "@/lib/primary-nav";

// Shared between ThreadSidebar (chat's own sidebar, which adds a thread list
// below these) and AppSidebar (every other page) so navigation looks and
// behaves identically everywhere rather than each page inventing its own.

function PrimaryNavGroup({ pathname }: { pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {PRIMARY_NAV_ITEMS.map(({ href, label, icon: NavIcon, disabled, disabledReason }) =>
            disabled ? (
              <SidebarMenuItem key={href}>
                <Tooltip>
                  <TooltipTrigger render={<span className="block" />}>
                    <SidebarMenuButton disabled>
                      <NavIcon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{disabledReason}</TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton render={<Link href={href} />} isActive={pathname === href}>
                  <NavIcon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function HealthNavGroup({ pathname }: { pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your health</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {HEALTH_NAV_ITEMS.map(({ href, label, icon: NavIcon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton render={<Link href={href} />} isActive={pathname === href}>
                <NavIcon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AccountFooter() {
  const { user } = useUser();
  const displayName =
    user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Account";

  return (
    <SidebarFooter className="p-3">
      <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-sidebar-border bg-background px-2.5 py-2.5">
        <UserButton
          appearance={{
            elements: {
              rootBox: "shrink-0",
              userButtonBox: "shrink-0",
              userButtonTrigger: "size-8 rounded-full",
              userButtonAvatarBox: "size-8 rounded-full",
              userButtonAvatarImage: "rounded-full",
            },
          }}
        />
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium leading-none text-sidebar-foreground">{displayName}</div>
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="truncate text-xs leading-none text-muted-foreground">
              {user.primaryEmailAddress.emailAddress}
            </div>
          )}
        </div>

        {/* Inert by design — the settings surface doesn't exist yet. */}
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
            <Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Settings">
              <GearIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Settings — coming soon</TooltipContent>
        </Tooltip>
      </div>
    </SidebarFooter>
  );
}

export { PrimaryNavGroup, HealthNavGroup, AccountFooter };
