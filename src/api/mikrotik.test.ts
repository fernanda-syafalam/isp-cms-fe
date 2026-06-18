import { beforeEach, describe, expect, it } from 'vitest'

import { listRouters } from './routers'
import { listQueues, listSecrets, listSessions } from './mikrotik'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the PPP secrets/sessions handlers honour the
// backend list contract — search, sort, limit/offset paging — and that the
// cross-resource join (connection state on secrets, customer/profile on
// sessions) is denormalized so neither list fetches the other.
let routerId: string

beforeEach(async () => {
  const { items } = await listRouters()
  const first = items[0]
  if (!first) throw new Error('seed has no routers')
  routerId = first.id
})

describe('listSecrets', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listSecrets(routerId)
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(items.every((s) => s.routerId === routerId)).toBe(true)
  })

  it('denormalizes live connection state onto each list item', async () => {
    const { items } = await listSecrets(routerId)
    const online = items.filter((s) => s.online)
    const offline = items.filter((s) => !s.online)
    expect(online.length).toBeGreaterThan(0)
    expect(offline.length).toBeGreaterThan(0)

    // Online secrets carry IP/uptime/sessionId; offline ones null them out.
    for (const s of online) {
      expect(s.address).not.toBeNull()
      expect(s.uptime).not.toBeNull()
      expect(s.sessionId).not.toBeNull()
    }
    for (const s of offline) {
      expect(s.address).toBeNull()
      expect(s.uptime).toBeNull()
      expect(s.sessionId).toBeNull()
    }
  })

  it("an online secret's address matches its session", async () => {
    const { items } = await listSecrets(routerId)
    const online = items.find((s) => s.online)
    if (!online) throw new Error('seed has no online secret')

    const { items: sessions } = await listSessions(routerId)
    const sess = sessions.find((x) => x.id === online.sessionId)
    expect(sess?.address).toBe(online.address)
    expect(sess?.uptime).toBe(online.uptime)
  })

  it('searches by username (case-insensitive)', async () => {
    const all = await listSecrets(routerId)
    const target = all.items[0]
    if (!target) throw new Error('seed has no secrets')

    const { items } = await listSecrets(routerId, {
      q: target.username.toUpperCase(),
    })
    expect(items.some((s) => s.id === target.id)).toBe(true)
  })

  it('searches by customer name', async () => {
    const all = await listSecrets(routerId)
    const target = all.items.find((s) => s.customerName)
    if (!target?.customerName) throw new Error('seed has no named customer secret')

    const { items } = await listSecrets(routerId, { q: target.customerName })
    expect(items.some((s) => s.id === target.id)).toBe(true)
  })

  it('sorts by username in both directions', async () => {
    const asc = await listSecrets(routerId, { sort: 'username', order: 'asc' })
    const ascNames = asc.items.map((s) => s.username)
    expect(ascNames).toEqual([...ascNames].sort((a, b) => a.localeCompare(b)))

    const desc = await listSecrets(routerId, {
      sort: 'username',
      order: 'desc',
    })
    expect(desc.items.map((s) => s.username)).toEqual([...ascNames].reverse())
  })

  it('sorts by disabled (active first ascending)', async () => {
    const { items } = await listSecrets(routerId, {
      sort: 'disabled',
      order: 'asc',
    })
    const last = items.at(-1)
    expect(last?.disabled).toBe(true)
    expect(items[0]?.disabled).toBe(false)
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listSecrets(routerId, { sort: 'username', order: 'asc' })
    const page = await listSecrets(routerId, {
      sort: 'username',
      order: 'asc',
      limit: 2,
      offset: 0,
    })
    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((s) => s.id)).toEqual(all.items.slice(0, 2).map((s) => s.id))

    const second = await listSecrets(routerId, {
      sort: 'username',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((s) => s.id)).toEqual(all.items.slice(2, 4).map((s) => s.id))
  })
})

describe('listSessions', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listSessions(routerId)
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(items.every((s) => s.routerId === routerId)).toBe(true)
  })

  it('denormalizes customer and profile onto each session', async () => {
    const { items } = await listSessions(routerId)
    expect(items.every((s) => typeof s.profileName === 'string')).toBe(true)
    expect(items.some((s) => s.customerName)).toBe(true)
  })

  it('searches by username (case-insensitive)', async () => {
    const all = await listSessions(routerId)
    const target = all.items[0]
    if (!target) throw new Error('seed has no sessions')

    const { items } = await listSessions(routerId, {
      q: target.username.toUpperCase(),
    })
    expect(items.some((s) => s.id === target.id)).toBe(true)
  })

  it('searches by IP address', async () => {
    const all = await listSessions(routerId)
    const target = all.items[0]
    if (!target) throw new Error('seed has no sessions')

    const { items } = await listSessions(routerId, { q: target.address })
    expect(items.some((s) => s.id === target.id)).toBe(true)
  })

  it('sorts by username in both directions', async () => {
    const asc = await listSessions(routerId, {
      sort: 'username',
      order: 'asc',
    })
    const ascNames = asc.items.map((s) => s.username)
    expect(ascNames).toEqual([...ascNames].sort((a, b) => a.localeCompare(b)))

    const desc = await listSessions(routerId, {
      sort: 'username',
      order: 'desc',
    })
    expect(desc.items.map((s) => s.username)).toEqual([...ascNames].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listSessions(routerId, {
      sort: 'username',
      order: 'asc',
    })
    const page = await listSessions(routerId, {
      sort: 'username',
      order: 'asc',
      limit: 2,
      offset: 0,
    })
    expect(page.total).toBe(all.total)
    expect(page.items.length).toBeLessThanOrEqual(2)
    expect(page.items.map((s) => s.id)).toEqual(all.items.slice(0, 2).map((s) => s.id))
  })
})

// Simple queues: search over name/target, sort whitelist name/target/maxLimit
// (default name asc), limit/offset paging — backend list contract.
describe('listQueues', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listQueues(routerId)
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
    expect(items.every((q) => q.routerId === routerId)).toBe(true)
  })

  it('searches by name (case-insensitive)', async () => {
    const all = await listQueues(routerId)
    const target = all.items[0]
    if (!target) throw new Error('seed has no queues')

    const { items } = await listQueues(routerId, {
      q: target.name.toUpperCase(),
    })
    expect(items.some((q) => q.id === target.id)).toBe(true)
  })

  it('searches by target', async () => {
    const all = await listQueues(routerId)
    const target = all.items[0]
    if (!target) throw new Error('seed has no queues')

    const { items } = await listQueues(routerId, { q: target.target })
    expect(items.some((q) => q.id === target.id)).toBe(true)
  })

  it('sorts by name in both directions', async () => {
    const asc = await listQueues(routerId, { sort: 'name', order: 'asc' })
    const ascNames = asc.items.map((q) => q.name)
    expect(ascNames).toEqual([...ascNames].sort((a, b) => a.localeCompare(b)))

    const desc = await listQueues(routerId, { sort: 'name', order: 'desc' })
    expect(desc.items.map((q) => q.name)).toEqual([...ascNames].reverse())
  })

  it('sorts by maxLimit', async () => {
    const asc = await listQueues(routerId, { sort: 'maxLimit', order: 'asc' })
    const limits = asc.items.map((q) => q.maxLimit)
    expect(limits).toEqual([...limits].sort((a, b) => a.localeCompare(b)))
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listQueues(routerId, { sort: 'name', order: 'asc' })
    const page = await listQueues(routerId, {
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 0,
    })
    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(2)
    expect(page.items.map((q) => q.id)).toEqual(all.items.slice(0, 2).map((q) => q.id))

    const second = await listQueues(routerId, {
      sort: 'name',
      order: 'asc',
      limit: 2,
      offset: 2,
    })
    expect(second.items.map((q) => q.id)).toEqual(all.items.slice(2, 4).map((q) => q.id))
  })
})
