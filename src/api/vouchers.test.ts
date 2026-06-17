import { describe, expect, it } from 'vitest'

import { listVouchers } from './vouchers'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the vouchers handler honours the backend list
// contract: search over code/profile, sort, limit/offset paging, the status
// equality filter, and a `summary` that stays a full-set invariant.
describe('listVouchers', () => {
  it('returns the full set with a matching total and a full-set summary', async () => {
    const { items, total, summary } = await listVouchers()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(summary.total).toBe(total)
    // Summary buckets reconcile against the rows.
    expect(summary.unused).toBe(items.filter((v) => v.status === 'unused').length)
    expect(summary.used).toBe(items.filter((v) => v.status === 'used').length)
  })

  it('filters by status but keeps summary a full-set invariant', async () => {
    const all = await listVouchers()
    const usedOnly = await listVouchers({ status: 'used' })

    expect(usedOnly.total).toBeLessThan(all.total)
    expect(usedOnly.items.every((v) => v.status === 'used')).toBe(true)
    // The KPI summary must NOT shrink with the table filter.
    expect(usedOnly.summary).toEqual(all.summary)
  })

  it('searches by code (case-insensitive)', async () => {
    const all = await listVouchers()
    const target = all.items[0]
    if (!target) throw new Error('seed has no vouchers')

    const { items } = await listVouchers({ q: target.code.toLowerCase() })
    expect(items.some((v) => v.id === target.id)).toBe(true)
  })

  it('sorts by price in both directions', async () => {
    const asc = await listVouchers({ sort: 'priceIdr', order: 'asc' })
    const ascPrices = asc.items.map((v) => v.priceIdr)
    expect(ascPrices).toEqual([...ascPrices].sort((a, b) => a - b))

    const desc = await listVouchers({ sort: 'priceIdr', order: 'desc' })
    expect(desc.items.map((v) => v.priceIdr)).toEqual([...ascPrices].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listVouchers({ sort: 'code', order: 'asc' })
    const page = await listVouchers({
      sort: 'code',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((v) => v.id)).toEqual(all.items.slice(0, 2).map((v) => v.id))

    const second = await listVouchers({
      sort: 'code',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((v) => v.id)).toEqual(all.items.slice(2, 4).map((v) => v.id))
  })
})
