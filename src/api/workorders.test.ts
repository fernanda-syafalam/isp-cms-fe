import { describe, expect, it } from 'vitest'

import { listWorkOrders } from './workorders'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the work-orders list handler honours the backend
// list contract: search, type filter, sort, and limit/offset paging.
describe('listWorkOrders', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listWorkOrders()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by work-order code (case-insensitive)', async () => {
    const all = await listWorkOrders()
    const target = all.items[0]
    if (!target) throw new Error('seed has no work orders')

    const { items } = await listWorkOrders({ q: target.code.toLowerCase() })
    expect(items).toHaveLength(1)
    expect(items[0]?.code).toBe(target.code)
  })

  it('searches by customer name', async () => {
    const all = await listWorkOrders()
    const target = all.items.find((w) => w.customerName)
    if (!target) throw new Error('seed has no named customer')

    const { items } = await listWorkOrders({ q: target.customerName })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((w) => w.customerName.includes(target.customerName))).toBe(true)
  })

  it('filters by work-order type', async () => {
    const { items, total } = await listWorkOrders({ type: 'install' })
    expect(items.length).toBe(total)
    expect(items.every((w) => w.type === 'install')).toBe(true)
  })

  it('sorts by code in both directions', async () => {
    const asc = await listWorkOrders({ sort: 'code', order: 'asc' })
    const desc = await listWorkOrders({ sort: 'code', order: 'desc' })
    const ascCodes = asc.items.map((w) => w.code)
    expect(ascCodes).toEqual([...ascCodes].sort())
    expect(desc.items.map((w) => w.code)).toEqual([...ascCodes].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listWorkOrders({ sort: 'code', order: 'asc' })
    const page = await listWorkOrders({
      sort: 'code',
      order: 'asc',
      limit: 4,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(4)
    expect(page.items.map((w) => w.code)).toEqual(all.items.slice(0, 4).map((w) => w.code))

    const second = await listWorkOrders({
      sort: 'code',
      order: 'asc',
      limit: 4,
      offset: 4,
    })
    expect(second.items.map((w) => w.code)).toEqual(all.items.slice(4, 8).map((w) => w.code))
  })
})
