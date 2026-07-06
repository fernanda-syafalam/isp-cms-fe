import { describe, expect, it } from 'vitest'

import { isNavItemActive, isRouteAllowed, navGroupsForRole, resolveBreadcrumb } from './nav'

describe('isNavItemActive', () => {
  it('matches the destination itself', () => {
    expect(isNavItemActive('/customers', '/customers')).toBe(true)
  })

  it('matches a nested route under the destination', () => {
    expect(isNavItemActive('/customers/42', '/customers')).toBe(true)
    expect(isNavItemActive('/network/topology/abc', '/network/topology')).toBe(true)
  })

  it('does not match a sibling that only shares a string prefix', () => {
    expect(isNavItemActive('/customers-archive', '/customers')).toBe(false)
    expect(isNavItemActive('/network/topology-old', '/network/topology')).toBe(false)
  })

  it('keeps the dashboard root exact', () => {
    expect(isNavItemActive('/', '/')).toBe(true)
    expect(isNavItemActive('/customers', '/')).toBe(false)
  })

  it('honors the exact flag', () => {
    expect(isNavItemActive('/leads', '/leads', true)).toBe(true)
    expect(isNavItemActive('/leads/99', '/leads', true)).toBe(false)
  })
})

describe('isRouteAllowed (shares the segment-aware matcher)', () => {
  it('admin/staff may visit everything', () => {
    expect(isRouteAllowed('admin', '/settings')).toBe(true)
  })

  it('restricts a role to its allowlist and nested routes', () => {
    expect(isRouteAllowed('teknisi', '/work-orders/123')).toBe(true)
    expect(isRouteAllowed('teknisi', '/invoices')).toBe(false)
  })

  it('does not grant a sibling that only shares a prefix', () => {
    expect(isRouteAllowed('customer', '/portal')).toBe(true)
    expect(isRouteAllowed('customer', '/portal-admin')).toBe(false)
  })

  it('grants mitra the reseller-scoped customer detail but not the org-wide list (P3.D.5)', () => {
    // The scoped detail nests under /resellers, so it is inside the mitra
    // allowlist by construction — no ROLE_ROUTES change needed.
    expect(isRouteAllowed('mitra', '/resellers/r1/customers/c1')).toBe(true)
    // The org-wide customer surface stays denied — the scope is not widened.
    expect(isRouteAllowed('mitra', '/customers/c1')).toBe(false)
  })
})

describe('navGroupsForRole', () => {
  it('drops groups with no visible items for a restricted role', () => {
    const groups = navGroupsForRole('mitra')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.items.map((i) => i.to)).toEqual(['/resellers'])
  })

  it('hides admin-only surfaces from staff (P3.E.4)', () => {
    const staffPaths = navGroupsForRole('staff').flatMap((g) => g.items.map((i) => i.to))
    for (const adminOnly of ['/setup', '/staff', '/security', '/audit', '/settings']) {
      expect(staffPaths).not.toContain(adminOnly)
    }
    // Staff keep their operational surfaces.
    expect(staffPaths).toContain('/customers')
    expect(staffPaths).toContain('/branches')
  })

  it('admin still sees the admin surfaces', () => {
    const adminPaths = navGroupsForRole('admin').flatMap((g) => g.items.map((i) => i.to))
    for (const adminOnly of ['/setup', '/staff', '/security', '/audit', '/settings']) {
      expect(adminPaths).toContain(adminOnly)
    }
  })
})

describe('isRouteAllowed (permission gate, P3.E.4)', () => {
  it('denies staff the admin-only routes but allows admin', () => {
    for (const path of ['/settings', '/audit', '/security', '/staff', '/setup']) {
      expect(isRouteAllowed('staff', path)).toBe(false)
      expect(isRouteAllowed('admin', path)).toBe(true)
    }
  })

  it('still allows staff their operational routes', () => {
    expect(isRouteAllowed('staff', '/customers')).toBe(true)
    expect(isRouteAllowed('staff', '/branches')).toBe(true)
  })
})

describe('resolveBreadcrumb', () => {
  it('labels the dashboard root', () => {
    expect(resolveBreadcrumb('/')).toEqual({
      to: null,
      label: 'Dasbor',
      hasDetail: false,
    })
  })

  it('matches a list route as a leaf section (no detail)', () => {
    expect(resolveBreadcrumb('/customers')).toEqual({
      to: '/customers',
      label: 'Pelanggan',
      hasDetail: false,
    })
  })

  it('flags a trailing segment as a detail leaf and picks the deepest match', () => {
    expect(resolveBreadcrumb('/customers/42')).toEqual({
      to: '/customers',
      label: 'Pelanggan',
      hasDetail: true,
    })
    expect(resolveBreadcrumb('/network/topology/abc')).toEqual({
      to: '/network/topology',
      label: 'Topologi',
      hasDetail: true,
    })
  })

  it('returns no section for an unknown or sibling-prefix path', () => {
    expect(resolveBreadcrumb('/nope')).toEqual({
      to: null,
      label: null,
      hasDetail: false,
    })
    expect(resolveBreadcrumb('/customers-archive')).toEqual({
      to: null,
      label: null,
      hasDetail: false,
    })
  })
})
