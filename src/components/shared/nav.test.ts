import { describe, expect, it } from 'vitest'

import { isNavItemActive, isRouteAllowed, navGroupsForRole } from './nav'

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
})

describe('navGroupsForRole', () => {
  it('drops groups with no visible items for a restricted role', () => {
    const groups = navGroupsForRole('mitra')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.items.map((i) => i.to)).toEqual(['/resellers'])
  })
})
