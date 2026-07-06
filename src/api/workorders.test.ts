import { describe, expect, it } from 'vitest'

import { completeWorkOrder, listWorkOrders } from './workorders'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the work-orders list handler honours the backend
// list contract: search, type filter, sort, and limit/offset paging.
describe('listWorkOrders', () => {
  it('returns the full set with a matching total when unfiltered', async () => {
    const { items, total } = await listWorkOrders()
    expect(items.length).toBe(total)
    expect(total).toBeGreaterThan(0)
  })

  it('searches by work-order code (case-insensitive)', async () => {
    const all = await listWorkOrders()
    const target = all.items[0]
    if (!target) throw new Error('seed has no work orders')

    const { items } = await listWorkOrders({ q: target.code.toLowerCase() })
    expect(items).toHaveLength(1)
    expect(items[0]?.code).toBe(target.code)
  })

  it('searches by customer name', async () => {
    const all = await listWorkOrders()
    const target = all.items.find((w) => w.customerName)
    if (!target) throw new Error('seed has no named customer')

    const { items } = await listWorkOrders({ q: target.customerName })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((w) => w.customerName.includes(target.customerName))).toBe(true)
  })

  it('filters by work-order type', async () => {
    const { items, total } = await listWorkOrders({ type: 'install' })
    expect(items.length).toBe(total)
    expect(items.every((w) => w.type === 'install')).toBe(true)
  })

  // "Tugas saya" (P3.B.1): the technician param is an exact-match scope. The
  // teknisi board sends the current user's fullName here.
  it('filters by technician (exact match) for the "Tugas saya" view', async () => {
    const all = await listWorkOrders()
    const target = all.items.find((w) => w.technician)
    if (!target?.technician) throw new Error('seed has no assigned work order')

    const { items, total } = await listWorkOrders({
      technician: target.technician,
    })
    expect(items.length).toBe(total)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((w) => w.technician === target.technician)).toBe(true)
    // Exact match, not substring: a different technician's orders are excluded.
    expect(items.every((w) => w.technician !== null)).toBe(true)
  })

  it('sorts by code in both directions', async () => {
    const asc = await listWorkOrders({ sort: 'code', order: 'asc' })
    const desc = await listWorkOrders({ sort: 'code', order: 'desc' })
    const ascCodes = asc.items.map((w) => w.code)
    expect(ascCodes).toEqual([...ascCodes].sort())
    expect(desc.items.map((w) => w.code)).toEqual([...ascCodes].reverse())
  })

  it('paginates with limit/offset while reporting the full total', async () => {
    const all = await listWorkOrders({ sort: 'code', order: 'asc' })
    const page = await listWorkOrders({
      sort: 'code',
      order: 'asc',
      limit: 4,
      offset: 0,
    })

    expect(page.total).toBe(all.total)
    expect(page.items).toHaveLength(4)
    expect(page.items.map((w) => w.code)).toEqual(all.items.slice(0, 4).map((w) => w.code))

    const second = await listWorkOrders({
      sort: 'code',
      order: 'asc',
      limit: 4,
      offset: 4,
    })
    expect(second.items.map((w) => w.code)).toEqual(all.items.slice(4, 8).map((w) => w.code))
  })
})

// P3.B.3 field-completion: the complete endpoint accepts an evidence body and
// echoes the captured evidence on the (schema-validated) work-order response.
describe('completeWorkOrder', () => {
  async function findOpenWorkOrder() {
    const { items } = await listWorkOrders()
    const wo = items.find((w) => w.status !== 'done' && w.status !== 'cancelled')
    if (!wo) throw new Error('seed has no completable work order')
    return wo
  }

  it('completes with an empty body (quick complete) and parses the new fields', async () => {
    const wo = await findOpenWorkOrder()
    const done = await completeWorkOrder(wo.id)

    expect(done.status).toBe('done')
    expect(done.completedAt).not.toBeNull()
    expect(done.completedBy).not.toBeNull()
    // No evidence was posted, so the capture fields stay null.
    expect(done.scannedOnuSerial).toBeNull()
    expect(done.measuredRxPower).toBeNull()
  })

  it('posts the field-completion body and echoes the captured evidence', async () => {
    const wo = await findOpenWorkOrder()
    const done = await completeWorkOrder(wo.id, {
      onuSerial: 'ZTEGABCD1234',
      rxPower: -21.4,
      photos: ['https://cdn.example.com/wo/photo-1.jpg'],
      signatureUrl: 'https://cdn.example.com/wo/ttd.png',
      gps: { lat: -6.5514, lng: 110.6811 },
      notes: 'Instalasi selesai, sinyal bagus.',
    })

    expect(done.status).toBe('done')
    expect(done.scannedOnuSerial).toBe('ZTEGABCD1234')
    expect(done.measuredRxPower).toBe(-21.4)
    expect(done.photos).toEqual(['https://cdn.example.com/wo/photo-1.jpg'])
    expect(done.signatureUrl).toBe('https://cdn.example.com/wo/ttd.png')
    expect(done.gpsLat).toBe(-6.5514)
    expect(done.gpsLng).toBe(110.6811)
  })
})
