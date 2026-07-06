import { describe, expect, it } from 'vitest'

import { listPayments } from './payments'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the payments list handler honours the backend list
// contract: search, sort, and limit/offset paging.
describe('listPayments', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listPayments()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by invoice number (case-insensitive)', async () => {
    const all = await listPayments()
    const target = all.items.find((p) => p.invoiceNo)
    if (!target?.invoiceNo) throw new Error('seed has no invoice payment')

    const { items } = await listPayments({ q: target.invoiceNo.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((p) => p.id === target.id)).toBe(true)
  })

  it('searches by customer name', async () => {
    const all = await listPayments()
    const target = all.items.find((p) => p.customerName)
    if (!target?.customerName) throw new Error('seed has no named-customer payment')

    const { items } = await listPayments({ q: target.customerName })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((p) => p.id === target.id)).toBe(true)
  })

  it('sorts by amount in both directions', async () => {
    const asc = await listPayments({ sort: 'amount', order: 'asc' })
    const desc = await listPayments({ sort: 'amount', order: 'desc' })
    const ascAmounts = asc.items.map((p) => p.amount)
    expect(desc.items.map((p) => p.amount)).toEqual([...ascAmounts].reverse())
    expect(ascAmounts).toEqual([...ascAmounts].sort((a, b) => a - b))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listPayments({ sort: 'amount', order: 'asc' })
    const page = await listPayments({
      sort: 'amount',
      order: 'asc',
      limit: 4,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(4)
    expect(page.items.map((p) => p.id)).toEqual(all.items.slice(0, 4).map((p) => p.id))

    const second = await listPayments({
      sort: 'amount',
      order: 'asc',
      limit: 4,
      offset: 4,
    })
    expect(second.items.map((p) => p.id)).toEqual(all.items.slice(4, 8).map((p) => p.id))
  })
})
