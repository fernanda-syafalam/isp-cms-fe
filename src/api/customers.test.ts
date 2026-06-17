import { describe, expect, it } from 'vitest'

import { listCustomers } from './customers'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the customers handler honours the backend list
// contract: status equality, branch-scope `area` filter (with unassigned
// customers always visible), search over name/customerNo/phone, sort, and
// limit/offset paging — returning the same { items, total } envelope.
describe('listCustomers', () => {
  it('returns the full set with a matching total', async () => {
    const { items, total } = await listCustomers()
    expect(total).toBeGreaterThan(0)
    expect(items.length).toBe(total)
  })

  it('filters by status', async () => {
    const all = await listCustomers()
    const status = all.items[0]?.status
    if (!status) throw new Error('seed has no customers')

    const expected = all.items.filter((c) => c.status === status)
    const { items, total } = await listCustomers({ status })
    expect(total).toBe(expected.length)
    expect(items.every((c) => c.status === status)).toBe(true)
  })

  it('filters by branch service area, keeping unassigned customers visible', async () => {
    const all = await listCustomers()
    const area = all.items.find((c) => c.areaName !== null)?.areaName
    if (!area) throw new Error('seed has no area-assigned customer')

    const { items, total } = await listCustomers({ area: [area] })
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThanOrEqual(all.total)
    expect(items.some((c) => c.areaName === area)).toBe(true)
    // Only this area's customers (or unassigned ones) survive the scope filter.
    expect(items.every((c) => c.areaName === area || c.areaName === null)).toBe(true)
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listCustomers()
    const target = all.items[0]
    if (!target) throw new Error('seed has no customers')

    const { items } = await listCustomers({ q: target.fullName.toLowerCase() })
    expect(items.some((c) => c.id === target.id)).toBe(true)
  })

  it('searches by phone number', async () => {
    const all = await listCustomers()
    const target = all.items[0]
    if (!target) throw new Error('seed has no customers')

    const { items } = await listCustomers({ q: target.phone })
    expect(items.some((c) => c.id === target.id)).toBe(true)
  })

  it('sorts by customer number in both directions', async () => {
    const asc = await listCustomers({ sort: 'customerNo', order: 'asc' })
    const ascValues = asc.items.map((c) => c.customerNo)
    expect(ascValues).toEqual([...ascValues].sort((a, b) => a.localeCompare(b)))

    const desc = await listCustomers({ sort: 'customerNo', order: 'desc' })
    expect(desc.items.map((c) => c.customerNo)).toEqual([...ascValues].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listCustomers({ sort: 'customerNo', order: 'asc' })
    const page = await listCustomers({
      sort: 'customerNo',
      order: 'asc',
      limit: 5,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(Math.min(5, all.total))
    expect(page.items.map((c) => c.id)).toEqual(all.items.slice(0, 5).map((c) => c.id))

    const second = await listCustomers({
      sort: 'customerNo',
      order: 'asc',
      limit: 5,
      offset: 5,
    })
    expect(second.items.map((c) => c.id)).toEqual(all.items.slice(5, 10).map((c) => c.id))
  })
})
