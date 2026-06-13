import { describe, expect, it } from 'vitest'

import { telNumber, waNumber } from './NodeDetailPanel'

// The phone formatting behind the on-site tap-to-call / WhatsApp buttons. A
// wrong number means the technician can't reach the customer, so the 0 → 62
// conversion is worth pinning down.
describe('telNumber', () => {
  it('keeps digits (and a leading +), dropping separators', () => {
    expect(telNumber('0812-3456-7890')).toBe('081234567890')
    expect(telNumber('0291 591234')).toBe('0291591234')
    expect(telNumber('+62 812 3456')).toBe('+628123456')
  })
})

describe('waNumber', () => {
  it('converts a leading Indonesian 0 to the 62 country code', () => {
    expect(waNumber('081234567890')).toBe('6281234567890')
    expect(waNumber('0812-3456-7890')).toBe('6281234567890')
  })

  it('leaves an already-international number alone (minus separators)', () => {
    expect(waNumber('62812345')).toBe('62812345')
    expect(waNumber('+62 812 345')).toBe('62812345')
  })
})
