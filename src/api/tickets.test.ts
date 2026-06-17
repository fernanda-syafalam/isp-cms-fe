import { describe, expect, it } from 'vitest'

import { listTickets } from './tickets'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the tickets list handler honours the backend list
// contract: search, status filter, sort, and limit/offset paging.
describe('listTickets', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listTickets()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by ticket code (case-insensitive)', async () => {
    const all = await listTickets()
    const target = all.items[0]
    if (!target) throw new Error('seed has no tickets')

    const { items } = await listTickets({ q: target.code.toLowerCase() })
    expect(items).toHaveLength(1)
    expect(items[0]?.code).toBe(target.code)
  })

  it('searches by customer name', async () => {
    const all = await listTickets()
    const target = all.items.find((t) => t.customerName)
    if (!target) throw new Error('seed has no named customer')

    const { items } = await listTickets({ q: target.customerName })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((t) => t.customerName.includes(target.customerName))).toBe(true)
  })

  it('filters by status', async () => {
    const { items, total } = await listTickets({ status: 'open' })
    expect(items.length).toBe(total)
    expect(items.every((t) => t.status === 'open')).toBe(true)
  })

  it('sorts by code in both directions', async () => {
    const asc = await listTickets({ sort: 'code', order: 'asc' })
    const desc = await listTickets({ sort: 'code', order: 'desc' })
    const ascCodes = asc.items.map((t) => t.code)
    expect(ascCodes).toEqual([...ascCodes].sort())
    expect(desc.items.map((t) => t.code)).toEqual([...ascCodes].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listTickets({ sort: 'code', order: 'asc' })
    const page = await listTickets({
      sort: 'code',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((t) => t.code)).toEqual(all.items.slice(0, 3).map((t) => t.code))

    const second = await listTickets({
      sort: 'code',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((t) => t.code)).toEqual(all.items.slice(3, 6).map((t) => t.code))
  })
})
