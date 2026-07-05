import { describe, expect, it } from 'vitest'

import { SetupStatusSchema } from './setup'

const VALID_PAYLOAD = {
  catalogue: { done: true, plansCount: 3 },
  network: { done: false, routersCount: 1, profilesCount: 0, poolsCount: 0 },
  branches: { done: true, branchesCount: 2 },
  settings: { done: true, companyName: 'Jepara Net' },
  staff: { done: true, staffCount: 5 },
  onboarding: { done: false, instalasiCount: 0, aktifCount: 0 },
  workOrders: { done: false, installDoneCount: 0 },
  active: { done: false, activeCount: 0 },
}

describe('SetupStatusSchema', () => {
  it('parses a well-formed payload', () => {
    const parsed = SetupStatusSchema.parse(VALID_PAYLOAD)
    expect(parsed.network.routersCount).toBe(1)
    expect(parsed.catalogue.done).toBe(true)
  })

  it('rejects negative counts', () => {
    const bad = { ...VALID_PAYLOAD, catalogue: { done: true, plansCount: -1 } }
    expect(() => SetupStatusSchema.parse(bad)).toThrow()
  })

  it('rejects a missing group', () => {
    const { active: _active, ...withoutActive } = VALID_PAYLOAD
    expect(() => SetupStatusSchema.parse(withoutActive)).toThrow()
  })
})
