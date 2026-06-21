import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/cn'

import { isNavItemActive, type NavGroup, type NavItem } from './nav'

export type Badge = { value: number; tone: 'default' | 'danger' }

type NavGroupSectionProps = {
  group: NavGroup
  pathname: string
  badges: Record<string, Badge>
  isOpen: boolean
  onToggle: () => void
}

// A collapsible nav group with its child links; child active state + attention
// badges are computed per-item.
export function NavGroupSection({
  group,
  pathname,
  badges,
  isOpen,
  onToggle,
}: NavGroupSectionProps) {
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
