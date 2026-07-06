import { describe, expect, it } from 'vitest'

import { CreatePayoutSchema, CreateResellerSchema, PayoutSchema } from './reseller'

const validPayout = {
  id: '00000000-0000-4000-8000-000000000001',
  resellerId: 'a3a3a3a3-1111-4111-8111-000000000000',
  amount: 250_000,
  status: 'requested',
  note: 'Pencairan komisi',
  requestedBy: '00000000-0000-4000-8000-000000000002',
  decidedBy: null,
  ledgerEntryId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  decidedAt: null,
}

describe('PayoutSchema', () => {
  it('parses a valid payout with nullable decision fields', () => {
    const parsed = PayoutSchema.parse(validPayout)
    expect(parsed.status).toBe('requested')
    expect(parsed.decidedBy).toBeNull()
    expect(parsed.ledgerEntryId).toBeNull()
    expect(parsed.decidedAt).toBeNull()
  })

  it('parses a disbursed payout with a linked ledger entry', () => {
    const parsed = PayoutSchema.parse({
      ...validPayout,
      status: 'paid',
      decidedBy: '00000000-0000-4000-8000-000000000003',
      ledgerEntryId: '00000000-0000-4000-8000-000000000004',
      decidedAt: '2026-01-02T00:00:00.000Z',
    })
    expect(parsed.status).toBe('paid')
    expect(parsed.ledgerEntryId).toBe('00000000-0000-4000-8000-000000000004')
  })

  it('rejects an unknown status', () => {
    expect(PayoutSchema.safeParse({ ...validPayout, status: 'cancelled' }).success).toBe(false)
  })
})

describe('CreatePayoutSchema', () => {
  it('accepts a positive integer amount with an optional note', () => {
    expect(CreatePayoutSchema.safeParse({ amount: 100_000 }).success).toBe(true)
    expect(CreatePayoutSchema.parse({ amount: 100_000, note: 'x' }).note).toBe('x')
  })

  it('rejects a non-positive, non-integer, or oversized amount', () => {
    expect(CreatePayoutSchema.safeParse({ amount: 0 }).success).toBe(false)
    expect(CreatePayoutSchema.safeParse({ amount: -1 }).success).toBe(false)
    expect(CreatePayoutSchema.safeParse({ amount: 10.5 }).success).toBe(false)
    expect(CreatePayoutSchema.safeParse({ amount: 2_000_000_001 }).success).toBe(false)
  })
})

describe('CreateResellerSchema', () => {
  it('accepts a valid reseller with a percent commission', () => {
    const parsed = CreateResellerSchema.parse({
      name: 'Loket Baru',
      area: 'Jepara',
      commissionPct: 7.5,
    })
    expect(parsed.commissionPct).toBe(7.5)
  })

  it('rejects an empty name and an out-of-range commission', () => {
    expect(
      CreateResellerSchema.safeParse({
        name: '',
        area: 'Jepara',
        commissionPct: 5,
      }).success,
    ).toBe(false)
    expect(
      CreateResellerSchema.safeParse({
        name: 'X',
        area: 'Jepara',
        commissionPct: 101,
      }).success,
    ).toBe(false)
    expect(
      CreateResellerSchema.safeParse({
        name: 'X',
        area: 'Jepara',
        commissionPct: -1,
      }).success,
    ).toBe(false)
  })
})
