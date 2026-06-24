import { describe, expect, it } from 'vitest'

import { rxDiagnosis, rxTone } from './optical-health'

describe('rxTone', () => {
  it('is neutral when the reading is missing', () => {
    expect(rxTone(null)).toBe('neutral')
  })

  it('is success at or above −25 dBm', () => {
    expect(rxTone(-10)).toBe('success')
    expect(rxTone(-25)).toBe('success') // boundary, inclusive
  })

  it('is warning in the −25…−27 marginal band', () => {
    expect(rxTone(-25.5)).toBe('warning')
    expect(rxTone(-26)).toBe('warning')
    expect(rxTone(-27)).toBe('warning') // boundary, inclusive
  })

  it('is danger below −27 dBm', () => {
    expect(rxTone(-27.01)).toBe('danger')
    expect(rxTone(-30)).toBe('danger')
    expect(rxTone(-40)).toBe('danger')
  })
})

describe('rxDiagnosis', () => {
  it('reports a healthy signal at or above −25 dBm', () => {
    expect(rxDiagnosis(-20)).toContain('sehat')
    expect(rxDiagnosis(-25)).toContain('sehat')
  })

  it('flags marginal attenuation in the −25…−27 band', () => {
    expect(rxDiagnosis(-26)).toContain('tekukan kabel')
    expect(rxDiagnosis(-27)).toContain('tekukan kabel') // boundary, inclusive
  })

  it('flags high attenuation in the −27…−30 band', () => {
    expect(rxDiagnosis(-28)).toContain('splice buruk')
    expect(rxDiagnosis(-30)).toContain('splice buruk') // boundary, inclusive
  })

  it('flags a critical / near-LOS signal below −30 dBm', () => {
    expect(rxDiagnosis(-31)).toContain('LOS')
    expect(rxDiagnosis(-45)).toContain('LOS')
  })
})
