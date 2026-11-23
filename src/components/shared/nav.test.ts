import { describe, expect, it } from 'vitest'

import {
  isNavItemActive,
  isRouteAllowed,
  MVP_HIDDEN_ROUTES,
  navGroupsForRole,
  resolveBreadcrumb,
  ROLE_HOME,
} from './nav'

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

  it('denies the customer and mitra roles every route (workspaces are hidden)', () => {
    for (const role of ['customer', 'mitra'] as const) {
      expect(isRouteAllowed(role, '/')).toBe(false)
      expect(isRouteAllowed(role, '/customers')).toBe(false)
      expect(isRouteAllowed(role, '/resellers')).toBe(false)
      expect(ROLE_HOME[role] ?? '/').toBe('/')
    }
  })

  it('blocks /resellers and /sla-credits for admin', () => {
    for (const path of ['/resellers', '/resellers/r1', '/sla-credits']) {
      expect(isRouteAllowed('admin', path)).toBe(false)
    }
  })
})

describe('navGroupsForRole', () => {
  it('drops groups with no visible items for a restricted role', () => {
    expect(navGroupsForRole('mitra')).toHaveLength(0)
    expect(navGroupsForRole('teknisi').length).toBeGreaterThan(0)
  })

  it('hides admin-only surfaces from staff (P3.E.4)', () => {
    const staffPaths = navGroupsForRole('staff').flatMap((g) => g.items.map((i) => i.to))
    for (const adminOnly of ['/setup', '/staff', '/security', '/audit', '/settings']) {
      expect(staffPaths).not.toContain(adminOnly)
    }
    // Staff keep their operational surfaces.
    expect(staffPaths).toContain('/customers')
    expect(staffPaths).toContain('/payments')
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
    expect(isRouteAllowed('staff', '/payments')).toBe(true)
  })
})

// Regression guard for the route-guard deep-link bypass (A1): the _auth layout
// enforces `isRouteAllowed` for EVERY role and redirects to `ROLE_HOME[role] ??
// '/'`. These assertions pin the exact inputs that guard relies on, so a role
// without a ROLE_HOME entry can never silently re-open the bypass.
describe('deep-link guard inputs (A1 route-guard bypass)', () => {
  it("denies staff deep-linking admin-only paths and lands them on '/'", () => {
    for (const path of ['/settings', '/setup']) {
      expect(isRouteAllowed('staff', path)).toBe(false)
    }
    // staff has no restricted home, so the guard falls back to the dashboard.
    expect(ROLE_HOME.staff ?? '/').toBe('/')
  })

  it('does not redirect an admin away from an admin-only path', () => {
    expect(isRouteAllowed('admin', '/settings')).toBe(true)
    expect(isRouteAllowed('admin', '/setup')).toBe(true)
  })

  it('denies teknisi and mitra the admin-only paths and gives them a valid home', () => {
    for (const path of ['/settings', '/setup']) {
      expect(isRouteAllowed('teknisi', path)).toBe(false)
      expect(isRouteAllowed('mitra', path)).toBe(false)
    }
    expect(ROLE_HOME.teknisi ?? '/').toBe('/work-orders')
    expect(ROLE_HOME.mitra ?? '/').toBe('/')
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
    expect(resolveBreadcrumb('/network/routers/abc')).toEqual({
      to: '/network/routers',
      label: 'Router (Mikrotik)',
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

describe('isRouteAllowed (MVP hidden routes)', () => {
  it.each(MVP_HIDDEN_ROUTES)('denies admin on %s and its sub-paths', (prefix) => {
    expect(isRouteAllowed('admin', prefix)).toBe(false)
    expect(isRouteAllowed('admin', `${prefix}/abc`)).toBe(false)
  })

  it('still allows kept routes that share a segment with hidden ones', () => {
    for (const path of ['/customers', '/customers/abc', '/network/routers', '/invoices']) {
      expect(isRouteAllowed('admin', path)).toBe(true)
    }
  })
})
