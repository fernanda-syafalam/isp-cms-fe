import { describe, expect, it } from 'vitest'

import { CreateLeadSchema, LeadSchema } from './lead'

const validLead = {
  id: '1ead0000-1111-4111-8111-000000000000',
  name: 'Calon A',
  phone: '081234567890',
  address: 'Jl. Pahlawan 1',
  areaName: 'Jepara',
  planName: 'Home 50 Mbps',
  stage: 'new',
  estValue: 200_000,
  source: 'reseller',
  note: null,
  resellerId: 'a3a3a3a3-1111-4111-8111-000000000000',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const validCreate = {
  name: 'Calon A',
  phone: '081234567890',
  address: 'Jl. Pahlawan 1',
  areaName: 'Jepara',
  planName: 'Home 50 Mbps',
  estValue: 200_000,
  source: 'reseller' as const,
}

describe('LeadSchema (referral attribution)', () => {
  it('parses the resellerId the BE returns', () => {
    expect(LeadSchema.parse(validLead).resellerId).toBe('a3a3a3a3-1111-4111-8111-000000000000')
  })

  it('accepts a null resellerId', () => {
    expect(LeadSchema.parse({ ...validLead, resellerId: null }).resellerId).toBeNull()
  })
})

describe('CreateLeadSchema (referral attribution)', () => {
  it('accepts an optional reseller id (P3.D.2)', () => {
    const parsed = CreateLeadSchema.parse({
      ...validCreate,
      resellerId: '00000000-0000-4000-8000-000000000003',
    })
    expect(parsed.resellerId).toBe('00000000-0000-4000-8000-000000000003')
  })

  it('treats resellerId as optional and accepts null', () => {
    expect(CreateLeadSchema.safeParse(validCreate).success).toBe(true)
    expect(CreateLeadSchema.parse({ ...validCreate, resellerId: null }).resellerId).toBeNull()
  })

  it('rejects a non-uuid resellerId', () => {
    expect(CreateLeadSchema.safeParse({ ...validCreate, resellerId: 'nope' }).success).toBe(false)
  })
})
