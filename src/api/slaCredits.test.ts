import { describe, expect, it } from 'vitest'

import { listSlaCredits } from './slaCredits'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the sla-credits handler honours the backend list
// contract: search over customerName/reason, sort, limit/offset paging, and a
// full-set `summary` (active amount + pending/applied counts) that stays an
// invariant under any table search.
describe('listSlaCredits', () => {
  it('returns the full set with a matching total and a self-consistent summary', async () => {
    const { items, total, summary } = await listSlaCredits()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    // The full set is returned here, so the aggregate must reconcile with it.
    expect(summary.activeAmount).toBe(
      items.filter((c) => c.status !== 'void').reduce((s, c) => s + c.amount, 0),
    )
    expect(summary.pending).toBe(items.filter((c) => c.status === 'pending').length)
    expect(summary.applied).toBe(items.filter((c) => c.status === 'applied').length)
  })

  it('searches by reason but keeps the summary a full-set invariant', async () => {
    const all = await listSlaCredits()
    const target = all.items[0]
    if (!target?.ticketCode) throw new Error('seed has no credit with a ticket code')

    // The ticket code is unique and embedded in the reason text.
    const narrowed = await listSlaCredits({ q: target.ticketCode })
    expect(narrowed.total).toBeLessThan(all.total)
    expect(narrowed.items.every((c) => c.reason.includes(target.ticketCode ?? ''))).toBe(true)
    // The KPI summary must NOT shrink with the table search.
    expect(narrowed.summary).toEqual(all.summary)
  })

  it('searches by customer name (case-insensitive)', async () => {
    const all = await listSlaCredits()
    const target = all.items[0]
    if (!target) throw new Error('seed has no sla credits')

    const { items } = await listSlaCredits({
      q: target.customerName.toLowerCase(),
    })
    expect(items.some((c) => c.id === target.id)).toBe(true)
  })

  it('sorts by amount in both directions', async () => {
    const asc = await listSlaCredits({ sort: 'amount', order: 'asc' })
    const ascAmounts = asc.items.map((c) => c.amount)
    expect(ascAmounts).toEqual([...ascAmounts].sort((a, b) => a - b))

    const desc = await listSlaCredits({ sort: 'amount', order: 'desc' })
    expect(desc.items.map((c) => c.amount)).toEqual([...ascAmounts].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listSlaCredits({ sort: 'amount', order: 'asc' })
    const page = await listSlaCredits({
      sort: 'amount',
      order: 'asc',
      limit: 1,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.id).toBe(all.items[0]?.id)

    const second = await listSlaCredits({
      sort: 'amount',
      order: 'asc',
      limit: 1,
      offset: 1,
    })
    expect(second.items[0]?.id).toBe(all.items[1]?.id)
  })
})
