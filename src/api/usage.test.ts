import { describe, expect, it } from 'vitest'

import { listUsage } from './usage'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the usage handler honours the backend list
// contract: search over customerName/planName, sort, limit/offset paging, and a
// full-set `summary` (total usage + FUP count + average) that stays an
// invariant under any table search.
describe('listUsage', () => {
  it('returns the full set with a matching total and a self-consistent summary', async () => {
    const { items, total, summary } = await listUsage()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    // The full set is returned here, so the aggregate must reconcile with it.
    expect(summary.totalUsedGb).toBe(items.reduce((s, u) => s + u.usedGb, 0))
    expect(summary.throttled).toBe(items.filter((u) => u.fupThrottled).length)
    expect(summary.avgUsedGb).toBe(Math.round(summary.totalUsedGb / items.length))
  })

  it('searches by customer name but keeps the summary a full-set invariant', async () => {
    const all = await listUsage()
    const target = all.items[0]
    if (!target) throw new Error('seed has no usage records')

    const narrowed = await listUsage({ q: target.customerName.toLowerCase() })
    expect(narrowed.total).toBeLessThanOrEqual(all.total)
    expect(narrowed.items.some((u) => u.customerId === target.customerId)).toBe(true)
    // The KPI summary must NOT shrink with the table search.
    expect(narrowed.summary).toEqual(all.summary)
  })

  it('searches by plan name (case-insensitive)', async () => {
    const all = await listUsage()
    const target = all.items[0]
    if (!target) throw new Error('seed has no usage records')

    const { items } = await listUsage({ q: target.planName.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(
      items.every((u) => u.planName.toLowerCase().includes(target.planName.toLowerCase())),
    ).toBe(true)
  })

  it('sorts by usedGb in both directions', async () => {
    const asc = await listUsage({ sort: 'usedGb', order: 'asc' })
    const ascUsed = asc.items.map((u) => u.usedGb)
    expect(ascUsed).toEqual([...ascUsed].sort((a, b) => a - b))

    const desc = await listUsage({ sort: 'usedGb', order: 'desc' })
    expect(desc.items.map((u) => u.usedGb)).toEqual([...ascUsed].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listUsage({ sort: 'usedGb', order: 'asc' })
    const page = await listUsage({
      sort: 'usedGb',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((u) => u.customerId)).toEqual(
      all.items.slice(0, 3).map((u) => u.customerId),
    )

    const second = await listUsage({
      sort: 'usedGb',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((u) => u.customerId)).toEqual(
      all.items.slice(3, 6).map((u) => u.customerId),
    )
  })
})
