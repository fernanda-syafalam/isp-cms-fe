import { Link, useRouterState } from '@tanstack/react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useEffectiveRole } from '@/features/auth'
import { ROLE_HOME, NAV_ITEMS } from './nav'

// Route-aware breadcrumb rendered with shadcn primitives. Matches the deepest
// nav item that prefixes the path; a remaining segment shows as "Detail".
export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const home = ROLE_HOME[useEffectiveRole()] ?? '/'

  const match = NAV_ITEMS.filter((i) => i.to !== '/' && pathname.startsWith(i.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
  const section = pathname === '/' ? 'Dasbor' : (match?.label ?? null)
  const hasDetail = Boolean(match && pathname.slice(match.to.length).replace(/^\/+/, ''))

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:block">
          <BreadcrumbLink asChild>
            <Link to={home}>ISP CMS</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {section ? (
          <>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              {hasDetail && match ? (
                <BreadcrumbLink asChild>
                  <Link to={match.to}>{section}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{section}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {hasDetail ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
