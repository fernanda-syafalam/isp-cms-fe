import { describe, expect, it } from 'vitest'

import { GenerateVoucherBatchSchema, VoucherSchema } from './voucher'

const validVoucher = {
  id: '00000000-0000-4000-8000-000000000001',
  code: 'ASH-7F3K-2M9P',
  batchId: 'BATCH-2026-01',
  profile: 'Hotspot 1 Hari',
  priceIdr: 5_000,
  durationDays: 1,
  status: 'unused',
  createdAt: '2026-07-06T03:00:00.000Z',
  usedAt: null,
  usedBy: null,
  resellerId: null,
  resellerName: null,
}

describe('VoucherSchema', () => {
  it('parses a voucher with no reseller attribution', () => {
    const parsed = VoucherSchema.parse(validVoucher)
    expect(parsed.resellerId).toBeNull()
    expect(parsed.resellerName).toBeNull()
  })

  it('parses a voucher attributed to a reseller', () => {
    const parsed = VoucherSchema.parse({
      ...validVoucher,
      resellerId: '00000000-0000-4000-8000-0000000000a3',
      resellerName: 'Loket Jepara',
    })
    expect(parsed.resellerId).toBe('00000000-0000-4000-8000-0000000000a3')
    expect(parsed.resellerName).toBe('Loket Jepara')
  })

  it('accepts a missing resellerName (optional) but requires resellerId', () => {
    const { resellerName: _drop, ...withoutName } = validVoucher
    expect(VoucherSchema.safeParse(withoutName).success).toBe(true)
    const { resellerId: _dropId, ...withoutId } = validVoucher
    expect(VoucherSchema.safeParse(withoutId).success).toBe(false)
  })
})

describe('GenerateVoucherBatchSchema', () => {
  const base = {
    count: 10,
    profile: 'Hotspot 1 Hari',
    priceIdr: 5_000,
    durationDays: 1,
  }

  it('accepts a batch with an optional resellerId', () => {
    const parsed = GenerateVoucherBatchSchema.parse({
      ...base,
      resellerId: '00000000-0000-4000-8000-0000000000a3',
    })
    expect(parsed.resellerId).toBe('00000000-0000-4000-8000-0000000000a3')
  })

  it('accepts a batch with no reseller (undefined/null)', () => {
    expect(GenerateVoucherBatchSchema.parse(base).resellerId).toBeUndefined()
    expect(GenerateVoucherBatchSchema.parse({ ...base, resellerId: null }).resellerId).toBeNull()
  })
})
