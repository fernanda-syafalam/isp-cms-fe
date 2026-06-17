import { describe, expect, it } from 'vitest'

import { getJournal } from './accounting'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). The seed posts paid invoices into June 2026, so that is the
// period with journal data. Proves the journal endpoint paginates/searches/sorts
// its lines while keeping `totals` a full-period invariant.
const PERIOD = '2026-06'

describe('getJournal', () => {
  it('returns the full period with total == line count and a balanced ledger', async () => {
    const { lines, total, totals } = await getJournal(PERIOD)
    expect(total).toBeGreaterThan(0)
    expect(lines.length).toBe(total)
    // Double-entry: a settled period must balance.
    expect(totals.debit).toBe(totals.credit)
  })

  it('searches lines by account name and shrinks total — but NOT the period totals', async () => {
    const all = await getJournal(PERIOD)
    const filtered = await getJournal(PERIOD, { q: 'pendapatan' })

    expect(filtered.total).toBeGreaterThan(0)
    expect(filtered.total).toBeLessThan(all.total)
    expect(filtered.lines.every((l) => /pendapatan/i.test(l.accountName))).toBe(true)
    // The balance badge is a period invariant: search must not change totals.
    expect(filtered.totals).toEqual(all.totals)
  })

  it('sorts lines by debit in both directions', async () => {
    const asc = await getJournal(PERIOD, { sort: 'debit', order: 'asc' })
    const ascDebits = asc.lines.map((l) => l.debit)
    expect(ascDebits).toEqual([...ascDebits].sort((a, b) => a - b))

    const desc = await getJournal(PERIOD, { sort: 'debit', order: 'desc' })
    expect(desc.lines.map((l) => l.debit)).toEqual([...ascDebits].reverse())
  })

  it('paginates lines while keeping total and period totals full', async () => {
    const all = await getJournal(PERIOD, { sort: 'accountCode', order: 'asc' })
    const page = await getJournal(PERIOD, {
      sort: 'accountCode',
      order: 'asc',
      limit: 2,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.totals).toEqual(all.totals)
    expect(page.lines).toHaveLength(2)
    expect(page.lines.map((l) => l.id)).toEqual(all.lines.slice(0, 2).map((l) => l.id))

    const second = await getJournal(PERIOD, {
      sort: 'accountCode',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.lines.map((l) => l.id)).toEqual(all.lines.slice(2, 4).map((l) => l.id))
  })
})
