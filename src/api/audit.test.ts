import { describe, expect, it } from 'vitest'

import { listAudit } from './audit'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the audit list handler honours the backend list
// contract: search, sort, default order, and limit/offset paging.
describe('listAudit', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listAudit()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('defaults to newest-first (at descending) when unsorted', async () => {
    const { items } = await listAudit()
    const times = items.map((e) => e.at)
    expect(times).toEqual([...times].sort().reverse())
  })

  it('searches by actor (case-insensitive)', async () => {
    const all = await listAudit()
    const target = all.items[0]
    if (!target) throw new Error('seed has no audit entries')

    const { items } = await listAudit({ q: target.actor.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((e) => e.actor === target.actor)).toBe(true)
    expect(items.some((e) => e.id === target.id)).toBe(true)
  })

  it('searches by action substring', async () => {
    const { items } = await listAudit({ q: 'billing.run' })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((e) => e.action.includes('billing.run'))).toBe(true)
  })

  it('sorts by timestamp in both directions', async () => {
    const asc = await listAudit({ sort: 'at', order: 'asc' })
    const desc = await listAudit({ sort: 'at', order: 'desc' })
    const ascAt = asc.items.map((e) => e.at)
    expect(desc.items.map((e) => e.at)).toEqual([...ascAt].reverse())
    expect(ascAt).toEqual([...ascAt].sort())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listAudit({ sort: 'at', order: 'asc' })
    const page = await listAudit({
      sort: 'at',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((e) => e.id)).toEqual(all.items.slice(0, 3).map((e) => e.id))

    const second = await listAudit({
      sort: 'at',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((e) => e.id)).toEqual(all.items.slice(3, 6).map((e) => e.id))
  })
})
