import { describe, expect, it } from 'vitest'

import { activateCustomer, isolateCustomer, listCustomers, stopCustomer } from './customers'
import { listTopology } from './topology'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the network status of a customer node is kept
// separate from its billing lifecycle: a suspended (isolir) customer stays
// optically `up` so dispatch never mistakes "belum bayar" for "fiber putus".
async function customerNode(customerId: string) {
  const topo = await listTopology()
  return topo.items.find((n) => n.meta?.customerId === customerId)
}

describe('topology network status vs billing lifecycle', () => {
  it('keeps an isolir customer optically up while flagging the lifecycle', async () => {
    const active = (await listCustomers({ status: 'aktif' })).items[0]
    if (!active) throw new Error('seed has no active customer')

    const before = await customerNode(active.id)
    expect(before?.status).toBe('up')
    expect(before?.meta?.lifecycle).toBe('aktif')

    await isolateCustomer(active.id)

    const isolated = await customerNode(active.id)
    // fiber is not cut — network status stays up; only billing changed
    expect(isolated?.status).toBe('up')
    expect(isolated?.meta?.lifecycle).toBe('isolir')
  })

  it('restores aktif lifecycle on activation', async () => {
    const isolir = (await listCustomers({ status: 'isolir' })).items[0]
    if (!isolir) throw new Error('seed has no isolir customer')

    const before = await customerNode(isolir.id)
    expect(before?.status).toBe('up')
    expect(before?.meta?.lifecycle).toBe('isolir')

    await activateCustomer(isolir.id)

    const after = await customerNode(isolir.id)
    expect(after?.status).toBe('up')
    expect(after?.meta?.lifecycle).toBe('aktif')
  })

  it('marks a stopped (berhenti) customer unknown, not down', async () => {
    const active = (await listCustomers({ status: 'aktif' })).items[0]
    if (!active) throw new Error('seed has no active customer')

    await stopCustomer(active.id)

    const stopped = await customerNode(active.id)
    // disconnected, not a fault: unknown rather than down (red).
    expect(stopped?.status).toBe('unknown')
    expect(stopped?.meta?.lifecycle).toBe('berhenti')
  })
})
