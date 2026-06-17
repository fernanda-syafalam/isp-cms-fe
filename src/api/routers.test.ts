import { describe, expect, it } from 'vitest'

import { listRouters } from './routers'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the routers handler honours the backend list
// contract: search over name/address/model, sort, and limit/offset paging.
describe('listRouters', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listRouters()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listRouters()
    const target = all.items[0]
    if (!target) throw new Error('seed has no routers')

    const { items } = await listRouters({ q: target.name.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((r) => r.id === target.id)).toBe(true)
  })

  it('searches by address', async () => {
    const all = await listRouters()
    const target = all.items[0]
    if (!target) throw new Error('seed has no routers')

    const { items } = await listRouters({ q: target.address })
    expect(items.some((r) => r.id === target.id)).toBe(true)
  })

  it('sorts by name in both directions', async () => {
    const asc = await listRouters({ sort: 'name', order: 'asc' })
    const ascNames = asc.items.map((r) => r.name)
    expect(ascNames).toEqual([...ascNames].sort((a, b) => a.localeCompare(b)))

    const desc = await listRouters({ sort: 'name', order: 'desc' })
    expect(desc.items.map((r) => r.name)).toEqual([...ascNames].reverse())
  })

  it('sorts by secret count ascending', async () => {
    const { items } = await listRouters({ sort: 'secretCount', order: 'asc' })
    const counts = items.map((r) => r.secretCount)
    expect(counts).toEqual([...counts].sort((a, b) => a - b))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listRouters({ sort: 'name', order: 'asc' })
    const page = await listRouters({
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((r) => r.id)).toEqual(all.items.slice(0, 2).map((r) => r.id))

    const second = await listRouters({
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((r) => r.id)).toEqual(all.items.slice(2, 4).map((r) => r.id))
  })
})
