import { describe, expect, it } from 'vitest'

import { listCoverage } from './coverage'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the coverage list handler honours the backend list
// contract: search, sort, default order, and limit/offset paging.
describe('listCoverage', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listCoverage()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('defaults to name ascending when unsorted', async () => {
    const { items } = await listCoverage()
    const names = items.map((c) => c.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listCoverage()
    const target = all.items[0]
    if (!target) throw new Error('seed has no coverage areas')

    const { items } = await listCoverage({ q: target.name.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((c) => c.id === target.id)).toBe(true)
  })

  it('sorts by name in both directions', async () => {
    const asc = await listCoverage({ sort: 'name', order: 'asc' })
    const desc = await listCoverage({ sort: 'name', order: 'desc' })
    const ascNames = asc.items.map((c) => c.name)
    expect(desc.items.map((c) => c.name)).toEqual([...ascNames].reverse())
    expect(ascNames).toEqual([...ascNames].sort((a, b) => a.localeCompare(b)))
  })

  it('sorts by capacity numerically', async () => {
    const { items } = await listCoverage({ sort: 'capacity', order: 'asc' })
    const caps = items.map((c) => c.capacity)
    expect(caps).toEqual([...caps].sort((a, b) => a - b))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listCoverage({ sort: 'name', order: 'asc' })
    const page = await listCoverage({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((c) => c.id)).toEqual(all.items.slice(0, 3).map((c) => c.id))

    const second = await listCoverage({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((c) => c.id)).toEqual(all.items.slice(3, 6).map((c) => c.id))
  })
})
