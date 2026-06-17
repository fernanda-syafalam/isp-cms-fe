import { describe, expect, it } from 'vitest'

import { listInvoices } from './invoices'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the invoices handler honours the backend list
// contract: search over invoiceNo/customerName, sort, limit/offset paging, the
// status equality filter, and an AR `summary` that stays a full-set invariant.
describe('listInvoices', () => {
  it('returns the full set with a matching total and a full-set AR summary', async () => {
    const { items, total, summary } = await listInvoices()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    // `summary.total` is the count of ALL invoices (full set).
    expect(summary.total).toBe(total)
    // Overdue is a subset of outstanding, so its sum can't exceed it.
    expect(summary.overdue).toBeLessThanOrEqual(summary.outstanding)
    expect(summary.unpaidCount).toBe(
      items.filter((i) => i.status === 'pending' || i.status === 'overdue').length,
    )
  })

  it('filters by status but keeps the AR summary a full-set invariant', async () => {
    const all = await listInvoices()
    const overdueOnly = await listInvoices({ status: 'overdue' })

    expect(overdueOnly.total).toBeLessThan(all.total)
    expect(overdueOnly.items.every((i) => i.status === 'overdue')).toBe(true)
    // The KPI summary must NOT shrink with the table filter.
    expect(overdueOnly.summary).toEqual(all.summary)
  })

  it('searches by customer name (case-insensitive)', async () => {
    const all = await listInvoices()
    const target = all.items[0]
    if (!target) throw new Error('seed has no invoices')

    const { items } = await listInvoices({
      q: target.customerName.toLowerCase(),
    })
    expect(items.some((i) => i.id === target.id)).toBe(true)
  })

  it('sorts by amount in both directions', async () => {
    const asc = await listInvoices({ sort: 'amount', order: 'asc' })
    const ascAmounts = asc.items.map((i) => i.amount)
    expect(ascAmounts).toEqual([...ascAmounts].sort((a, b) => a - b))

    const desc = await listInvoices({ sort: 'amount', order: 'desc' })
    expect(desc.items.map((i) => i.amount)).toEqual([...ascAmounts].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listInvoices({ sort: 'invoiceNo', order: 'asc' })
    const page = await listInvoices({
      sort: 'invoiceNo',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((i) => i.id)).toEqual(all.items.slice(0, 2).map((i) => i.id))

    const second = await listInvoices({
      sort: 'invoiceNo',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((i) => i.id)).toEqual(all.items.slice(2, 4).map((i) => i.id))
  })
})
