// Registry: @shadcn/sidebar-07
// Origin: https://ui.shadcn.com/r/styles/base-vega/sidebar-07.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-20, sha256 e339bea9299547f4c32530fc0f81cb7bb4d05d75c88eb3166a46749f4ba80f63
// Siyahi edit: the sample data is removed; the app passes its own navigation
// and, optionally, a header (or teams), projects and user.
// Siyahi edit: every optional prop also takes undefined (`?: T | undefined`), so a
// page under exactOptionalPropertyTypes can write `prop: cond ? value : undefined`.
"use client"

import * as React from "react"

import { NavMain } from "@siyahi/ui/components/registry/sidebar-07/nav-main"
import { NavProjects } from "@siyahi/ui/components/registry/sidebar-07/nav-projects"
import { NavUser } from "@siyahi/ui/components/registry/sidebar-07/nav-user"
import { TeamSwitcher } from "@siyahi/ui/components/registry/sidebar-07/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@siyahi/ui/components/ui/sidebar"
import { cn } from "@siyahi/ui/lib/utils"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navMain: React.ComponentProps<typeof NavMain>["items"]
  navLabel?: string | undefined
  /** Shown at the top instead of the team switcher. */
  header?: React.ReactNode
  teams?: React.ComponentProps<typeof TeamSwitcher>["teams"] | undefined
  projects?: React.ComponentProps<typeof NavProjects>["projects"] | undefined
  user?: React.ComponentProps<typeof NavUser>["user"] | undefined
}

// Siyahi edit: collapsible="none" renders the sidebar in place (as the
// catalogue's example does) and drops the rail, which has nothing to toggle.
// Siyahi edit: core pins the fixed sidebar to h-svh, the viewport with the
// browser's bars shown, so on a phone in landscape it stopped short of the
// bottom once Safari hid its bars. h-auto lets its inset-y-0 size it.
export function AppSidebar({ navMain, navLabel, header, teams, projects, user, collapsible = "icon", className, ...props }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(collapsible !== "none" && "h-auto", className)}
      {...props}
    >
      {(header || teams) && (
        <SidebarHeader>{header ?? (teams && <TeamSwitcher teams={teams} />)}</SidebarHeader>
      )}
      <SidebarContent>
        <NavMain items={navMain} label={navLabel} />
        {projects && <NavProjects projects={projects} />}
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
      {collapsible !== "none" && <SidebarRail />}
    </Sidebar>
  )
}
