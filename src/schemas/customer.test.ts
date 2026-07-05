import { describe, expect, it } from 'vitest'

import { CustomerSchema } from './customer'

const validCustomer = {
  id: '11111111-1111-4111-8111-111111111111',
  customerNo: 'CUST-0001',
  fullName: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  address: 'Jl. Merdeka 1',
  areaId: '22222222-2222-4222-8222-222222222222',
  areaName: 'Jepara',
  planId: '33333333-3333-4333-8333-333333333333',
  planName: 'Home 50 Mbps',
  status: 'aktif',
  outstanding: 0,
  billingAnchorDay: 15,
  npwp: null,
  ktp: null,
  consentAt: null,
  resellerName: null,
  connection: null,
  joinedAt: '2026-01-01T00:00:00.000Z',
}

describe('CustomerSchema', () => {
  it('parses a customer with an assigned area', () => {
    expect(CustomerSchema.parse(validCustomer).areaName).toBe('Jepara')
  })

  // The real BE customer response returns area nullable (no areas module wires
  // a subscriber to a service area yet). The schema must accept it so .parse()
  // does not throw at the API boundary on cutover.
  it('parses a customer with an unassigned area (areaId/areaName null)', () => {
    const parsed = CustomerSchema.parse({
      ...validCustomer,
      areaId: null,
      areaName: null,
    })
    expect(parsed.areaId).toBeNull()
    expect(parsed.areaName).toBeNull()
  })

  it('rejects an unknown lifecycle status', () => {
    expect(CustomerSchema.safeParse({ ...validCustomer, status: 'pending' }).success).toBe(false)
  })

  it('accepts a null billing anchor day (follows operator default)', () => {
    expect(
      CustomerSchema.parse({ ...validCustomer, billingAnchorDay: null }).billingAnchorDay,
    ).toBeNull()
  })

  it('rejects a billing anchor day outside 1..28', () => {
    expect(CustomerSchema.safeParse({ ...validCustomer, billingAnchorDay: 31 }).success).toBe(false)
  })
})
