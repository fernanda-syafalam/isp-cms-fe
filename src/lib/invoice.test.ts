import { describe, expect, it } from 'vitest'

import { invoiceTotal } from './invoice'

describe('invoiceTotal', () => {
  it('sums DPP (amount) + late fee + PPN', () => {
    expect(invoiceTotal({ amount: 100_000, lateFee: 5_000, taxAmount: 11_000 })).toBe(116_000)
  })

  it('equals the base amount when there is no fee or tax', () => {
    expect(invoiceTotal({ amount: 50_000, lateFee: 0, taxAmount: 0 })).toBe(50_000)
  })
})
