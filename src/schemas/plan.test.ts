import { describe, expect, it } from 'vitest'

import { CreatePlanSchema, PlanSchema } from './plan'

const validPlan = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Home 50',
  speedMbps: 50,
  priceMonthly: 350_000,
  status: 'active',
  fupGb: 750,
  rateLimitProfile: '50M/50M',
}

describe('PlanSchema', () => {
  it('parses a plan carrying network params (FUP + rate-limit profile)', () => {
    const plan = PlanSchema.parse(validPlan)
    expect(plan.fupGb).toBe(750)
    expect(plan.rateLimitProfile).toBe('50M/50M')
  })

  it('treats FUP/profile as optional — an unlimited plan omits fupGb', () => {
    const { fupGb, ...unlimited } = validPlan
    const plan = PlanSchema.parse(unlimited)
    expect(plan.fupGb).toBeUndefined()
  })

  it('rejects a negative FUP quota', () => {
    expect(PlanSchema.safeParse({ ...validPlan, fupGb: -1 }).success).toBe(false)
  })
})

describe('CreatePlanSchema', () => {
  it('accepts the new network params on create', () => {
    const parsed = CreatePlanSchema.parse({
      name: 'Pro 100',
      speedMbps: 100,
      priceMonthly: 600_000,
      rateLimitProfile: '100M/100M',
    })
    expect(parsed.rateLimitProfile).toBe('100M/100M')
    expect(parsed.fupGb).toBeUndefined()
  })
})
