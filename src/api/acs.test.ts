import { describe, expect, it } from 'vitest'

import { listAcsDevices } from './acs'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the ACS devices handler honours the backend list
// contract: search over serial + customerName, sort, and limit/offset paging.
describe('listAcsDevices', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listAcsDevices()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by serial (case-insensitive)', async () => {
    const all = await listAcsDevices()
    const target = all.items[0]
    if (!target) throw new Error('seed has no ACS devices')

    const { items } = await listAcsDevices({ q: target.serial.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((d) => d.id === target.id)).toBe(true)
  })

  it('searches by customer name (case-insensitive)', async () => {
    const all = await listAcsDevices()
    const target = all.items[0]
    if (!target) throw new Error('seed has no ACS devices')

    const { items } = await listAcsDevices({
      q: target.customerName.toLowerCase(),
    })
    expect(items.some((d) => d.id === target.id)).toBe(true)
  })

  it('sorts by serial in both directions', async () => {
    const asc = await listAcsDevices({ sort: 'serial', order: 'asc' })
    const ascSerials = asc.items.map((d) => d.serial)
    expect(ascSerials).toEqual([...ascSerials].sort((a, b) => a.localeCompare(b)))

    const desc = await listAcsDevices({ sort: 'serial', order: 'desc' })
    expect(desc.items.map((d) => d.serial)).toEqual([...ascSerials].reverse())
  })

  it('sorts by customer name ascending', async () => {
    const { items } = await listAcsDevices({
      sort: 'customerName',
      order: 'asc',
    })
    const names = items.map((d) => d.customerName)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listAcsDevices({ sort: 'serial', order: 'asc' })
    const page = await listAcsDevices({
      sort: 'serial',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((d) => d.id)).toEqual(all.items.slice(0, 2).map((d) => d.id))

    const second = await listAcsDevices({
      sort: 'serial',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((d) => d.id)).toEqual(all.items.slice(2, 4).map((d) => d.id))
  })
})
