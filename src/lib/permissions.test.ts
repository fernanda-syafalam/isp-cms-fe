import { describe, expect, it } from 'vitest'

import { type Permission, ROLES, can, isRole } from './permissions'

describe('isRole', () => {
  it('accepts every known role', () => {
    for (const role of ROLES) expect(isRole(role)).toBe(true)
  })

  it('rejects unknown values and nullish input', () => {
    expect(isRole('superuser')).toBe(false)
    expect(isRole('')).toBe(false)
    expect(isRole(null)).toBe(false)
    expect(isRole(undefined)).toBe(false)
  })
})

describe('can', () => {
  const everyPermission: Permission[] = [
    'customers.manage',
    'tickets.manage',
    'billing.run',
    'network.manage',
    'plans.manage',
    'staff.manage',
    'resellers.manage',
    'vouchers.manage',
    'settings.manage',
    'records.delete',
    'data.reset',
  ]

  it('grants admin every permission', () => {
    for (const p of everyPermission) expect(can('admin', p)).toBe(true)
  })

  it('scopes staff to operational permissions', () => {
    expect(can('staff', 'customers.manage')).toBe(true)
    expect(can('staff', 'billing.run')).toBe(true)
    expect(can('staff', 'network.manage')).toBe(true)
    // Staff is not an administrator.
    expect(can('staff', 'settings.manage')).toBe(false)
    expect(can('staff', 'staff.manage')).toBe(false)
    expect(can('staff', 'records.delete')).toBe(false)
    expect(can('staff', 'data.reset')).toBe(false)
  })

  it('scopes teknisi to network + tickets', () => {
    expect(can('teknisi', 'network.manage')).toBe(true)
    expect(can('teknisi', 'tickets.manage')).toBe(true)
    expect(can('teknisi', 'billing.run')).toBe(false)
    expect(can('teknisi', 'customers.manage')).toBe(false)
  })

  it('grants mitra and customer nothing (view-only self-service)', () => {
    for (const p of everyPermission) {
      expect(can('mitra', p)).toBe(false)
      expect(can('customer', p)).toBe(false)
    }
  })
})
