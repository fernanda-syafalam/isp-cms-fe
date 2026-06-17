import { describe, expect, it } from 'vitest'

import { listOdp } from './odp'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the ODP handler honours the backend list contract:
// search over name/area, sort, limit/offset paging, the capacity/health `view`
// filter, and a `summary` that stays a full-set invariant.
describe('listOdp', () => {
  it('returns the full set with a matching total and a self-consistent summary', async () => {
    const { items, total, summary } = await listOdp()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(summary.totalOdp).toBe(total)

    // Summary aggregates reconcile against the full row set.
    const free = (o: (typeof items)[number]) => o.totalPorts - o.usedPorts
    const totalPorts = items.reduce((s, o) => s + o.totalPorts, 0)
    const usedPorts = items.reduce((s, o) => s + o.usedPorts, 0)
    expect(summary.utilization).toBe(Math.round((usedPorts / totalPorts) * 100))
    expect(summary.full).toBe(items.filter((o) => free(o) === 0).length)
    expect(summary.optical).toBe(items.filter((o) => o.status !== 'healthy').length)
  })

  it('filters by view but keeps summary a full-set invariant', async () => {
    const all = await listOdp()
    const optical = await listOdp({ view: 'optical' })

    expect(optical.total).toBeLessThanOrEqual(all.total)
    expect(optical.items.every((o) => o.status !== 'healthy')).toBe(true)
    // The KPI summary must NOT shrink with the table filter.
    expect(optical.summary).toEqual(all.summary)
  })

  it('restricts the available view to ODP with a free port', async () => {
    const { items } = await listOdp({ view: 'available' })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((o) => o.totalPorts - o.usedPorts > 0)).toBe(true)
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listOdp()
    const target = all.items[0]
    if (!target) throw new Error('seed has no ODP')

    const { items } = await listOdp({ q: target.name.toLowerCase() })
    expect(items.some((o) => o.id === target.id)).toBe(true)
  })

  it('sorts by used ports in both directions', async () => {
    const asc = await listOdp({ sort: 'usedPorts', order: 'asc' })
    const ascValues = asc.items.map((o) => o.usedPorts)
    expect(ascValues).toEqual([...ascValues].sort((a, b) => a - b))

    const desc = await listOdp({ sort: 'usedPorts', order: 'desc' })
    expect(desc.items.map((o) => o.usedPorts)).toEqual([...ascValues].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listOdp({ sort: 'name', order: 'asc' })
    const page = await listOdp({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((o) => o.id)).toEqual(all.items.slice(0, 3).map((o) => o.id))

    const second = await listOdp({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((o) => o.id)).toEqual(all.items.slice(3, 6).map((o) => o.id))
  })
})
