import { describe, expect, it } from 'vitest'

import { listInventory } from './inventory'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the inventory list handler honours the backend list
// contract: search, status filter, sort, and limit/offset paging.
describe('listInventory', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listInventory()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by serial (case-insensitive)', async () => {
    const all = await listInventory()
    const target = all.items[0]
    if (!target) throw new Error('seed has no inventory items')

    const { items } = await listInventory({ q: target.serial.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((i) => i.id === target.id)).toBe(true)
  })

  it('searches by assigned customer name', async () => {
    const all = await listInventory()
    const target = all.items.find((i) => i.assignedTo)
    if (!target?.assignedTo) throw new Error('seed has no installed item')

    const { items } = await listInventory({ q: target.assignedTo })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((i) => i.id === target.id)).toBe(true)
  })

  it('filters by status', async () => {
    const { items, total } = await listInventory({ status: 'installed' })
    expect(items.length).toBe(total)
    expect(items.every((i) => i.status === 'installed')).toBe(true)
  })

  it('sorts by serial in both directions', async () => {
    const asc = await listInventory({ sort: 'serial', order: 'asc' })
    const desc = await listInventory({ sort: 'serial', order: 'desc' })
    const ascSerials = asc.items.map((i) => i.serial)
    expect(desc.items.map((i) => i.serial)).toEqual([...ascSerials].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listInventory({ sort: 'serial', order: 'asc' })
    const page = await listInventory({
      sort: 'serial',
      order: 'asc',
      limit: 5,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(5)
    expect(page.items.map((i) => i.id)).toEqual(all.items.slice(0, 5).map((i) => i.id))

    const second = await listInventory({
      sort: 'serial',
      order: 'asc',
      limit: 5,
      offset: 5,
    })
    expect(second.items.map((i) => i.id)).toEqual(all.items.slice(5, 10).map((i) => i.id))
  })
})
