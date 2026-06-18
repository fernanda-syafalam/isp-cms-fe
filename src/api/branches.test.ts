import { describe, expect, it } from 'vitest'

import { listBranches } from './branches'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the branches handler honours the backend list
// contract: search over name/city/manager, sort, limit/offset paging, and a
// `summary` that stays a full-set invariant under any table filter.
describe('listBranches', () => {
  it('returns the full set with a matching total and a self-consistent summary', async () => {
    const { items, total, summary } = await listBranches()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(summary.branches).toBe(total)

    // Summary aggregates reconcile against the full row set.
    expect(summary.customers).toBe(items.reduce((s, b) => s + b.customerCount, 0))
    expect(summary.mrr).toBe(items.reduce((s, b) => s + b.mrr, 0))
  })

  it('searches by name (case-insensitive) and keeps summary a full-set invariant', async () => {
    const all = await listBranches()
    const target = all.items[0]
    if (!target) throw new Error('seed has no branch')

    const { items, total, summary } = await listBranches({
      q: target.name.toLowerCase(),
    })
    expect(items.some((b) => b.id === target.id)).toBe(true)
    expect(total).toBeLessThanOrEqual(all.total)
    // The KPI summary must NOT shrink with the table filter.
    expect(summary).toEqual(all.summary)
  })

  it('searches by city', async () => {
    const all = await listBranches()
    const target = all.items[0]
    if (!target) throw new Error('seed has no branch')

    const { items } = await listBranches({ q: target.city })
    expect(items.every((b) => b.city.toLowerCase().includes(target.city.toLowerCase()))).toBe(true)
  })

  it('sorts by customer count in both directions', async () => {
    const asc = await listBranches({ sort: 'customerCount', order: 'asc' })
    const ascValues = asc.items.map((b) => b.customerCount)
    expect(ascValues).toEqual([...ascValues].sort((a, b) => a - b))

    const desc = await listBranches({ sort: 'customerCount', order: 'desc' })
    expect(desc.items.map((b) => b.customerCount)).toEqual([...ascValues].reverse())
  })

  it('sorts by MRR descending', async () => {
    const { items } = await listBranches({ sort: 'mrr', order: 'desc' })
    const values = items.map((b) => b.mrr)
    expect(values).toEqual([...values].sort((a, b) => b - a))
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listBranches({ sort: 'name', order: 'asc' })
    const page = await listBranches({
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((b) => b.id)).toEqual(all.items.slice(0, 2).map((b) => b.id))

    const second = await listBranches({
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((b) => b.id)).toEqual(all.items.slice(2, 4).map((b) => b.id))
  })
})
