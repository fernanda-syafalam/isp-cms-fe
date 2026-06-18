import { Link, useRouterState } from '@tanstack/react-router'
import { Building2Icon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useEffectiveRole } from '@/features/auth'
import { ROLE_HOME, type NavGroup, isNavItemActive, navGroupsForRole } from './nav'

// Groups that stay open by default; others collapse to tidy the long nav.
const ALWAYS_OPEN = new Set(['Ringkasan', 'Operasional'])

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const role = useEffectiveRole()
  const groups = navGroupsForRole(role)
  const home = ROLE_HOME[role] ?? '/'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="gap-2">
              {/* Brand/home link: pin active to an exact match so it isn't
                  reported as the current page on every route. */}
              <Link to={home} activeOptions={{ exact: true }}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2Icon className="size-4" />
                </span>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-tight">ISP CMS</span>
                  <span className="truncate text-muted-foreground text-xs">Operasi ISP</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <NavGroupSection key={group.label} group={group} pathname={pathname} />
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

function NavGroupSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const hasActive = group.items.some((it) => isNavItemActive(pathname, it.to, it.exact))
  const [open, setOpen] = useState(hasActive || ALWAYS_OPEN.has(group.label))

  // In icon (collapsed) mode the group label/trigger is hidden, so a closed
  // group would hide its icons with no way to reveal them. Force every group
  // open there to keep all destinations reachable; the user's per-group choice
  // is preserved for the expanded sidebar.
  const isOpen = state === 'collapsed' ? true : open

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CollapsibleTrigger>
            {group.label}
            <ChevronRightIcon
              aria-hidden="true"
              className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isNavItemActive(pathname, item.to, item.exact)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link
                        to={item.to}
                        // Scope the Link's own active match (which drives its
                        // automatic aria-current="page") to a segment match,
                        // exact for the dashboard root — otherwise "/" reports
                        // active on every page. Matches `isActive` above.
                        activeOptions={{ exact: Boolean(item.exact) }}
                        onClick={() => {
                          // Close the mobile sheet so the chosen page is visible.
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
