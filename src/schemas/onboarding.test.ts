import { describe, expect, it } from 'vitest'

import { OnboardingSchema } from './onboarding'

// Minimal valid onboarding payload without any of the new optional fields.
const BASE = {
  fullName: 'Budi Santoso',
  phone: '081234567',
  email: '',
  address: 'Jl. Pemuda No. 12, Jepara',
  areaName: 'Jepara',
  planId: 'plan-1',
  technician: 'Teknisi Budi',
  scheduledAt: '2026-07-10',
}

describe('OnboardingSchema', () => {
  it('accepts the new ODP + KYC + consent fields', () => {
    const parsed = OnboardingSchema.parse({
      ...BASE,
      odpId: 'odp-1',
      ktp: '3300123456789012',
      npwp: '00.000.000.0-000.000',
      consent: true,
    })

    expect(parsed.odpId).toBe('odp-1')
    expect(parsed.ktp).toBe('3300123456789012')
    expect(parsed.npwp).toBe('00.000.000.0-000.000')
    expect(parsed.consent).toBe(true)
  })

  it('treats odpId, ktp, npwp, and consent as optional', () => {
    expect(() => OnboardingSchema.parse(BASE)).not.toThrow()
  })

  it('accepts an optional reseller id and treats it as optional (P3.D.2)', () => {
    const parsed = OnboardingSchema.parse({
      ...BASE,
      resellerId: '00000000-0000-4000-8000-000000000002',
    })
    expect(parsed.resellerId).toBe('00000000-0000-4000-8000-000000000002')
    expect(OnboardingSchema.safeParse(BASE).success).toBe(true)
    expect(OnboardingSchema.parse({ ...BASE, resellerId: null }).resellerId).toBeNull()
  })

  it('rejects a KTP longer than 32 chars', () => {
    expect(OnboardingSchema.safeParse({ ...BASE, ktp: 'x'.repeat(33) }).success).toBe(false)
  })

  it('rejects an NPWP longer than 40 chars', () => {
    expect(OnboardingSchema.safeParse({ ...BASE, npwp: 'y'.repeat(41) }).success).toBe(false)
  })
})
