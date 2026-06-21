import { Link, useRouterState } from '@tanstack/react-router'
import { NetworkIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { UserMenu, useEffectiveRole } from '@/features/auth'
import { BranchScopeSwitcher } from '@/features/branches'
import { useDashboardSummary } from '@/hooks/useAnalytics'

import { type Badge, NavGroupSection } from './AppSidebarNav'
import { isNavItemActive, navGroupsForRole, ROLE_HOME } from './nav'

// Groups that start expanded; others collapse so the long nav stays scannable.
const DEFAULT_OPEN = new Set(['Ringkasan', 'Operasional'])

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const role = useEffectiveRole()
  const groups = navGroupsForRole(role)
  const home = ROLE_HOME[role] ?? '/'
  const canScopeBranch = role === 'admin' || role === 'staff'

  // Live attention counts, mirrored onto the matching nav targets as pills.
  const badges = useNavBadges()

  // Open-state lives here so "Tutup/Buka semua" can act on every group at once.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .filter(
            (g) =>
              DEFAULT_OPEN.has(g.label) ||
              g.items.some((it) => isNavItemActive(pathname, it.to, it.exact)),
          )
          .map((g) => g.label),
      ),
  )
  const anyOpen = openGroups.size > 0

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  const toggleAll = () => setOpenGroups(anyOpen ? new Set() : new Set(groups.map((g) => g.label)))

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="gap-2.5">
              {/* Brand/home link: pin active to an exact match so it isn't
                  reported as the current page on every route. */}
              <Link to={home} activeOptions={{ exact: true }}>
                <span className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <NetworkIcon className="size-5" />
                </span>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-tight">ISP CMS</span>
                  <span className="truncate text-muted-foreground text-xs">Operasi ISP</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {canScopeBranch ? <BranchScopeSwitcher variant="card" /> : null}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
            <span className="font-medium text-[0.7rem] text-sidebar-foreground/50 uppercase tracking-wider">
              Menu
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sidebar-foreground/50 text-xs transition-colors hover:text-sidebar-foreground"
            >
              {anyOpen ? 'Tutup semua' : 'Buka semua'}
            </button>
          </div>
          <SidebarMenu>
            {groups.map((group) => (
              <NavGroupSection
                key={group.label}
                group={group}
                pathname={pathname}
                badges={badges}
                isOpen={openGroups.has(group.label)}
                onToggle={() => toggleGroup(group.label)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu variant="card" />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

// Derive the attention pills from the dashboard aggregate (already cached when
// the dashboard is visited). Each entry maps a nav target to a count + tone.
function useNavBadges(): Record<string, Badge> {
  const { data } = useDashboardSummary()
  if (!data) return {}
  const badges: Record<string, Badge> = {}
  if (data.openTickets > 0) badges['/tickets'] = { value: data.openTickets, tone: 'default' }
  if (data.overdueCount > 0) badges['/invoices'] = { value: data.overdueCount, tone: 'danger' }
  const offline = data.devicesTotal - data.devicesOnline
  if (offline > 0) badges['/network/devices'] = { value: offline, tone: 'danger' }
  return badges
}
