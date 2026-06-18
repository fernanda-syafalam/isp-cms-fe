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
import { ROLE_HOME, resolveBreadcrumb } from './nav'

// Route-aware breadcrumb rendered with shadcn primitives. The trail is derived
// by the pure {@link resolveBreadcrumb}; here we only render and keep it from
// overflowing the sticky header on narrow screens (truncate + no-wrap).
export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const home = ROLE_HOME[useEffectiveRole()] ?? '/'
  const { to, label, hasDetail } = resolveBreadcrumb(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="hidden shrink-0 sm:block">
          <BreadcrumbLink asChild>
            <Link to={home}>ISP CMS</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {label ? (
          <>
            <BreadcrumbSeparator className="hidden shrink-0 sm:block" />
            <BreadcrumbItem className="min-w-0">
              {hasDetail && to ? (
                <BreadcrumbLink asChild className="min-w-0 truncate">
                  <Link to={to}>{label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="min-w-0 truncate">{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {hasDetail ? (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
