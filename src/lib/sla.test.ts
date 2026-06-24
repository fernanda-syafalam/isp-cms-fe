import { describe, expect, it } from 'vitest'

import { slaState } from './sla'

// Fixed "now" so the time-band math is deterministic.
const NOW = Date.parse('2026-01-01T00:00:00.000Z')
const HOUR = 3_600_000
const dueIn = (ms: number) => new Date(NOW + ms).toISOString()

describe('slaState', () => {
  it('is resolved regardless of due time', () => {
    expect(slaState('resolved', dueIn(-10 * HOUR), NOW)).toEqual({
      tone: 'success',
      label: 'Selesai',
      breached: false,
    })
  })

  it('is breached when the status says so', () => {
    const s = slaState('breached', dueIn(5 * HOUR), NOW)
    expect(s.breached).toBe(true)
    expect(s.tone).toBe('danger')
    expect(s.label).toBe('SLA terlampaui')
  })

  it('is breached when the due time has passed', () => {
    expect(slaState('open', dueIn(-1), NOW).breached).toBe(true)
    expect(slaState('open', dueIn(0), NOW).breached).toBe(true) // remaining <= 0
  })

  it('warns (amber) when under 4 hours remain', () => {
    const s = slaState('open', dueIn(2 * HOUR), NOW)
    expect(s.tone).toBe('warning')
    expect(s.label).toBe('2 jam lagi')
    expect(s.breached).toBe(false)
  })

  it('is neutral at or above the 4-hour threshold', () => {
    expect(slaState('open', dueIn(4 * HOUR), NOW)).toMatchObject({
      tone: 'neutral',
      label: '4 jam lagi',
    })
    expect(slaState('open', dueIn(5 * HOUR), NOW)).toMatchObject({
      tone: 'neutral',
      label: '5 jam lagi',
    })
  })

  it('counts in days once a full day or more remains', () => {
    expect(slaState('open', dueIn(24 * HOUR), NOW).label).toBe('1 hari lagi')
    expect(slaState('open', dueIn(50 * HOUR), NOW).label).toBe('2 hari lagi')
  })

  it('counts in minutes under an hour, never below 1', () => {
    expect(slaState('open', dueIn(30 * 60_000), NOW).label).toBe('30 menit lagi')
    expect(slaState('open', dueIn(30_000), NOW).label).toBe('1 menit lagi') // floors to 0 → clamp 1
  })
})
