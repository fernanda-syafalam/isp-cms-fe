import { describe, expect, it } from 'vitest'

import { listNotificationLog } from './notifications'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the notification send-log handler honours the
// backend list contract: search over recipient/template, sort, and limit/offset
// paging. The log has no equality filter — search/sort/paging only.
describe('listNotificationLog', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listNotificationLog()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by recipient (case-insensitive)', async () => {
    const all = await listNotificationLog()
    const target = all.items[0]
    if (!target) throw new Error('seed has no notification log entries')

    const { items } = await listNotificationLog({ q: target.to.toLowerCase() })
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((r) => r.to === target.to)).toBe(true)
  })

  it('searches by template name (case-insensitive)', async () => {
    const all = await listNotificationLog()
    const target = all.items[0]
    if (!target) throw new Error('seed has no notification log entries')

    const { items } = await listNotificationLog({
      q: target.templateName.toLowerCase(),
    })
    expect(items.length).toBeGreaterThan(0)
    expect(
      items.every((r) => r.templateName.toLowerCase().includes(target.templateName.toLowerCase())),
    ).toBe(true)
  })

  it('sorts by recipient in both directions', async () => {
    const asc = await listNotificationLog({ sort: 'to', order: 'asc' })
    const ascTo = asc.items.map((r) => r.to)
    expect(ascTo).toEqual([...ascTo].sort((a, b) => a.localeCompare(b)))

    const desc = await listNotificationLog({ sort: 'to', order: 'desc' })
    expect(desc.items.map((r) => r.to)).toEqual([...ascTo].reverse())
  })

  it('defaults to newest-first (at descending) when unsorted', async () => {
    const { items } = await listNotificationLog()
    const times = items.map((r) => r.at)
    expect(times).toEqual([...times].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listNotificationLog({ sort: 'to', order: 'asc' })
    const page = await listNotificationLog({
      sort: 'to',
      order: 'asc',
      limit: 3,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(3)
    expect(page.items.map((r) => r.id)).toEqual(all.items.slice(0, 3).map((r) => r.id))

    const second = await listNotificationLog({
      sort: 'to',
      order: 'asc',
      limit: 3,
      offset: 3,
    })
    expect(second.items.map((r) => r.id)).toEqual(all.items.slice(3, 6).map((r) => r.id))
  })
})
