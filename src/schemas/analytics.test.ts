import { describe, expect, it } from 'vitest'

import fixture from '@/test/contract/fixtures/analytics.dashboard.json'

import { DashboardSummarySchema } from './analytics'

describe('DashboardSummarySchema (command center removed)', () => {
  it('parses a response with no commandCenter (new backend)', () => {
    expect('commandCenter' in fixture).toBe(false)
    expect(DashboardSummarySchema.safeParse(fixture).success).toBe(true)
  })

  it('still parses a response carrying commandCenter.slaCreditsPending (old backend)', () => {
    const old = { ...fixture, commandCenter: { churnRate: 0.02, slaCreditsPending: 3 } }
    const parsed = DashboardSummarySchema.parse(old)
    expect('commandCenter' in parsed).toBe(false)
  })
})
