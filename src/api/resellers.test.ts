import { describe, expect, it } from 'vitest'

import { listResellerLedger, listResellers } from './resellers'

async function firstResellerId(): Promise<string> {
  const { items } = await listResellers()
  const target = items[0]
  if (!target) throw new Error('seed has no resellers')
  return target.id
}

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the resellers list handler honours the backend list
// contract: search, status filter, sort, and limit/offset paging.
describe('listResellers', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listResellers()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listResellers()
    const target = all.items[0]
    if (!target) throw new Error('seed has no resellers')

    const { items } = await listResellers({ q: target.name.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((r) => r.id === target.id)).toBe(true)
  })

  it('filters by status', async () => {
    const { items, total } = await listResellers({ status: 'active' })
    expect(items.length).toBe(total)
    expect(items.every((r) => r.status === 'active')).toBe(true)
  })

  it('sorts by name in both directions', async () => {
    const asc = await listResellers({ sort: 'name', order: 'asc' })
    const desc = await listResellers({ sort: 'name', order: 'desc' })
    const ascNames = asc.items.map((r) => r.name)
    expect(desc.items.map((r) => r.name)).toEqual([...ascNames].reverse())
  })

  it('sorts by balance numerically', async () => {
    const { items } = await listResellers({ sort: 'balance', order: 'asc' })
    const balances = items.map((r) => r.balance)
    expect(balances).toEqual([...balances].sort((a, b) => a - b))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listResellers({ sort: 'name', order: 'asc' })
    const page = await listResellers({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((r) => r.id)).toEqual(all.items.slice(0, 3).map((r) => r.id))

    const second = await listResellers({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((r) => r.id)).toEqual(all.items.slice(3, 6).map((r) => r.id))
  })
})

// The reseller ledger sub-resource: search over note, sort whitelist
// at/type/amount/balanceAfter (default at desc), limit/offset paging.
describe('listResellerLedger', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const id = await firstResellerId()
    const { items, total } = await listResellerLedger(id)
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(items.every((e) => e.resellerId === id)).toBe(true)
  })

  it('defaults to newest first (at desc)', async () => {
    const id = await firstResellerId()
    const { items } = await listResellerLedger(id)
    const ats = items.map((e) => e.at)
    expect(ats).toEqual([...ats].sort((a, b) => (a < b ? 1 : -1)))
  })

  it('searches by note (case-insensitive) and reports the filtered total', async () => {
    const id = await firstResellerId()
    const full = await listResellerLedger(id)
    const { items, total } = await listResellerLedger(id, { q: 'komisi' })
    expect(items.length).toBe(total)
    expect(total).toBeLessThan(full.total)
    expect(items.every((e) => e.note.toLowerCase().includes('komisi'))).toBe(true)
  })

  it('sorts by amount numerically in both directions', async () => {
    const id = await firstResellerId()
    const asc = await listResellerLedger(id, { sort: 'amount', order: 'asc' })
    const desc = await listResellerLedger(id, {
      sort: 'amount',
      order: 'desc',
    })
    const amounts = asc.items.map((e) => e.amount)
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b))
    expect(desc.items.map((e) => e.amount)).toEqual([...amounts].reverse())
  })

  it('sorts by balanceAfter ascending', async () => {
    const id = await firstResellerId()
    const { items } = await listResellerLedger(id, {
      sort: 'balanceAfter',
      order: 'asc',
    })
    const balances = items.map((e) => e.balanceAfter)
    expect(balances).toEqual([...balances].sort((a, b) => a - b))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const id = await firstResellerId()
    const all = await listResellerLedger(id, { sort: 'at', order: 'asc' })
    const page = await listResellerLedger(id, {
      sort: 'at',
      order: 'asc',
      limit: 2,
      offset: 0,
    })
    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((e) => e.id)).toEqual(all.items.slice(0, 2).map((e) => e.id))

    const second = await listResellerLedger(id, {
      sort: 'at',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((e) => e.id)).toEqual(all.items.slice(2, 4).map((e) => e.id))
  })
})
