import { describe, expect, it } from 'vitest'

import { listDeviceMetrics } from './monitoring'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the device-metrics handler honours the backend list
// contract: search over name/areaName, sort, limit/offset paging, and a
// fleet-health `summary` that stays a full-set invariant (drives the NOC KPI
// cards + overall status badge regardless of the table filter).
describe('listDeviceMetrics', () => {
  it('returns the full set with a matching total and a self-consistent summary', async () => {
    const { items, total, summary } = await listDeviceMetrics()

    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    // No paging → the page is the full set, so total === summary.total.
    expect(summary.total).toBe(total)
    // Every device is exactly one of up/degraded/down.
    expect(summary.up + summary.degraded + summary.down).toBe(summary.total)
    // avgUptimePct is the rounded mean over the full set.
    const expectedAvg =
      Math.round((items.reduce((s, m) => s + m.uptimePct, 0) / items.length) * 10) / 10
    expect(summary.avgUptimePct).toBe(expectedAvg)
  })

  it('searches by device name but keeps the summary a full-set invariant', async () => {
    const all = await listDeviceMetrics()
    const target = all.items[0]
    if (!target) throw new Error('seed has no device metrics')

    const result = await listDeviceMetrics({ q: target.name.toLowerCase() })
    expect(result.items.some((m) => m.deviceId === target.deviceId)).toBe(true)
    expect(result.total).toBeLessThanOrEqual(all.total)
    // The KPI summary must NOT shrink with the table search.
    expect(result.summary).toEqual(all.summary)
  })

  it('searches by area name (case-insensitive)', async () => {
    const all = await listDeviceMetrics()
    const target = all.items.find((m) => m.areaName.length > 0)
    if (!target) throw new Error('seed has no area names')

    const { items, summary } = await listDeviceMetrics({
      q: target.areaName.toLowerCase(),
    })
    expect(
      items.every((m) => m.areaName.toLowerCase().includes(target.areaName.toLowerCase())),
    ).toBe(true)
    expect(summary).toEqual(all.summary)
  })

  it('sorts by uptime in both directions', async () => {
    const asc = await listDeviceMetrics({ sort: 'uptimePct', order: 'asc' })
    const ascUptime = asc.items.map((m) => m.uptimePct)
    expect(ascUptime).toEqual([...ascUptime].sort((a, b) => a - b))

    const desc = await listDeviceMetrics({ sort: 'uptimePct', order: 'desc' })
    expect(desc.items.map((m) => m.uptimePct)).toEqual([...ascUptime].reverse())
  })

  it('paginates with limit/offset while reporting the full total and summary', async () => {
    const all = await listDeviceMetrics({ sort: 'name', order: 'asc' })
    const page = await listDeviceMetrics({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.summary).toEqual(all.summary)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((m) => m.deviceId)).toEqual(all.items.slice(0, 3).map((m) => m.deviceId))

    const second = await listDeviceMetrics({
      sort: 'name',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((m) => m.deviceId)).toEqual(
      all.items.slice(3, 6).map((m) => m.deviceId),
    )
  })
})
