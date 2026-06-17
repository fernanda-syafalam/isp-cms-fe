import { describe, expect, it } from 'vitest'

import { listDevices } from './devices'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the devices list handler honours the backend list
// contract: search, type/status filters, sort, and limit/offset paging.
describe('listDevices', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listDevices()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by device name (case-insensitive)', async () => {
    const all = await listDevices()
    const target = all.items[0]
    if (!target) throw new Error('seed has no devices')

    const { items } = await listDevices({ q: target.name.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((d) => d.id === target.id)).toBe(true)
  })

  it('searches by IP address', async () => {
    const all = await listDevices()
    const target = all.items[0]
    if (!target) throw new Error('seed has no devices')

    const { items } = await listDevices({ q: target.ipAddress })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((d) => d.ipAddress.includes(target.ipAddress))).toBe(true)
  })

  it('filters by device type', async () => {
    const { items, total } = await listDevices({ type: 'onu' })
    expect(items.length).toBe(total)
    expect(items.every((d) => d.type === 'onu')).toBe(true)
  })

  it('filters by status', async () => {
    const { items, total } = await listDevices({ status: 'online' })
    expect(items.length).toBe(total)
    expect(items.every((d) => d.status === 'online')).toBe(true)
  })

  it('sorts by name in both directions', async () => {
    const asc = await listDevices({ sort: 'name', order: 'asc' })
    const desc = await listDevices({ sort: 'name', order: 'desc' })
    const ascNames = asc.items.map((d) => d.name)
    expect(desc.items.map((d) => d.name)).toEqual([...ascNames].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listDevices({ sort: 'name', order: 'asc' })
    const page = await listDevices({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((d) => d.id)).toEqual(all.items.slice(0, 3).map((d) => d.id))

    const second = await listDevices({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((d) => d.id)).toEqual(all.items.slice(3, 6).map((d) => d.id))
  })
})
