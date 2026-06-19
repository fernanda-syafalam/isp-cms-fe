import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRightIcon, NetworkIcon } from 'lucide-react'
import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { UserMenu, useEffectiveRole } from '@/features/auth'
import { BranchScopeSwitcher } from '@/features/branches'
import { useDashboardSummary } from '@/hooks/useAnalytics'
import { cn } from '@/lib/cn'

import { ROLE_HOME, type NavGroup, type NavItem, isNavItemActive, navGroupsForRole } from './nav'

// Groups that start expanded; others collapse so the long nav stays scannable.
const DEFAULT_OPEN = new Set(['Ringkasan', 'Operasional'])

type Badge = { value: number; tone: 'default' | 'danger' }

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

type NavGroupSectionProps = {
  group: NavGroup
  pathname: string
  badges: Record<string, Badge>
  isOpen: boolean
  onToggle: () => void
}

function NavGroupSection({ group, pathname, badges, isOpen, onToggle }: NavGroupSectionProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const GroupIcon = group.icon

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={onToggle} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="font-medium">
            <GroupIcon />
            <span>{group.label}</span>
            <ChevronRightIcon
              aria-hidden="true"
              className="ml-auto size-4 shrink-0 text-sidebar-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-0.5 ml-4 space-y-0.5 border-sidebar-border border-l pl-2.5">
            {group.items.map((item) => (
              <NavSubItem
                key={item.to}
                item={item}
                badge={badges[item.to]}
                active={isNavItemActive(pathname, item.to, item.exact)}
                onNavigate={() => {
                  if (isMobile) setOpenMobile(false)
                }}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

type NavSubItemProps = {
  item: NavItem
  badge: Badge | undefined
  active: boolean
  onNavigate: () => void
}

function NavSubItem({ item, badge, active, onNavigate }: NavSubItemProps) {
  return (
    <li>
      <Link
        to={item.to}
        // Scope the Link's own active match (which drives aria-current="page")
        // to a segment match — exact for the dashboard root, which would
        // otherwise report active on every page. Matches `active` above.
        activeOptions={{ exact: Boolean(item.exact) }}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
          active
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )}
      >
        <span className="truncate">{item.label}</span>
        {badge ? <NavBadge badge={badge} /> : null}
      </Link>
    </li>
  )
}

function NavBadge({ badge }: { badge: Badge }) {
  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-medium text-xs tabular-nums',
        badge.tone === 'danger'
          ? 'bg-destructive/15 text-destructive'
          : 'bg-sidebar-accent text-sidebar-foreground/80',
      )}
    >
      {badge.value > 99 ? '99+' : badge.value}
    </span>
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
