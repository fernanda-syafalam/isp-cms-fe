import { useRouterState } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'

import { NAV_ITEMS } from './nav'

// Route-aware breadcrumb. Matches the deepest nav item that prefixes the current
// path; a remaining segment (e.g. a detail id) shows as "Detail".
export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const crumbs: string[] = []
  if (pathname === '/') {
    crumbs.push('Dasbor')
  } else {
    const match = NAV_ITEMS.filter((i) => i.to !== '/' && pathname.startsWith(i.to)).sort(
      (a, b) => b.to.length - a.to.length,
    )[0]
    if (match) {
      crumbs.push(match.label)
      if (pathname.slice(match.to.length).replace(/^\/+/, '')) crumbs.push('Detail')
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">ISP CMS</span>
      {crumbs.map((crumb, i) => (
        <span key={crumb} className="flex items-center gap-1.5">
          <ChevronRightIcon className="size-3.5 text-muted-foreground/50" />
          <span
            className={
              i === crumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
            }
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  )
}
