import { describe, expect, it } from 'vitest'

import type { SetupStatus } from '@/schemas/setup'
import { buildSteps } from './setupSteps'

const ALL_DONE: SetupStatus = {
  catalogue: { done: true, plansCount: 3 },
  network: { done: true, routersCount: 2, profilesCount: 8, poolsCount: 2 },
  branches: { done: true, branchesCount: 3 },
  settings: { done: true, companyName: 'Jepara Net' },
  staff: { done: true, staffCount: 5 },
  onboarding: { done: true, instalasiCount: 1, aktifCount: 4 },
  workOrders: { done: true, installDoneCount: 2 },
  active: { done: true, activeCount: 4 },
}

const NONE_DONE: SetupStatus = {
  catalogue: { done: false, plansCount: 0 },
  network: { done: false, routersCount: 0, profilesCount: 0, poolsCount: 0 },
  branches: { done: false, branchesCount: 0 },
  settings: { done: false, companyName: '' },
  staff: { done: false, staffCount: 0 },
  onboarding: { done: false, instalasiCount: 0, aktifCount: 0 },
  workOrders: { done: false, installDoneCount: 0 },
  active: { done: false, activeCount: 0 },
}

describe('buildSteps', () => {
  it('maps the payload to the eight FLOWS §3.1 steps in order', () => {
    const steps = buildSteps(ALL_DONE)
    expect(steps).toHaveLength(8)
    expect(steps.map((s) => s.cta.to)).toEqual([
      '/plans',
      '/network/routers',
      '/branches',
      '/settings',
      '/staff',
      '/customers/onboarding',
      '/work-orders',
      '/customers',
    ])
  })

  it('takes every `done` from the server flag', () => {
    expect(buildSteps(ALL_DONE).every((s) => s.done)).toBe(true)
    expect(buildSteps(NONE_DONE).every((s) => !s.done)).toBe(true)
  })

  it('renders honest per-step counts in the status subtext', () => {
    const network = buildSteps({
      ...ALL_DONE,
      network: {
        done: false,
        routersCount: 1,
        profilesCount: 0,
        poolsCount: 0,
      },
    })[1]
    expect(network?.status).toBe('1 router, 0 profil, 0 pool')
  })

  it('falls back when the company name is empty', () => {
    const settings = buildSteps(NONE_DONE)[3]
    expect(settings?.status).toBe('Nama perusahaan belum diisi')
  })
})
