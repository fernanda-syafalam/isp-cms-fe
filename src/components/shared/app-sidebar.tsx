import { Link, useRouterState } from '@tanstack/react-router'
import { Building2Icon, ChevronRightIcon } from 'lucide-react'

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
} from '@/components/ui/sidebar'
import { useEffectiveRole } from '@/features/auth'
import { ROLE_HOME, type NavGroup, navGroupsForRole } from './nav'

function isActive(pathname: string, to: string, exact?: boolean) {
  if (to === '/') return pathname === '/'
  return exact ? pathname === to : pathname.startsWith(to)
}

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
              <Link to={home}>
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
  const hasActive = group.items.some((it) => isActive(pathname, it.to, it.exact))
  const defaultOpen = hasActive || ALWAYS_OPEN.has(group.label)

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CollapsibleTrigger>
            {group.label}
            <ChevronRightIcon className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.to, item.exact)}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
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
