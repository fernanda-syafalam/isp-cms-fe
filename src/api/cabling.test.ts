import { describe, expect, it } from 'vitest'

import { installCustomerDrop, listSplitters } from './cabling'
import { listCustomers } from './customers'
import { deleteNode, listTopology } from './topology'

// Integration over the MSW layer (server from test/setup.ts; resetMockDb runs
// before each test). Proves the DELETE cascade frees the cabling a customer drop
// holds, so projected capacity stays honest.
function occupiedFor(
  splitters: Awaited<ReturnType<typeof listSplitters>>,
  customerId: string,
): number {
  return splitters.items.reduce(
    (acc, s) => acc + s.ports.filter((p) => p.customerId === customerId).length,
    0,
  )
}

describe('topology DELETE cascade (cabling)', () => {
  it('frees the splitter port when a customer node is deleted', async () => {
    const topo = await listTopology()
    const customer = topo.items.find((n) => n.type === 'customer' && n.meta?.customerId)
    const customerId = customer?.meta?.customerId
    if (!customer || !customerId) throw new Error('seed has no provisioned customer node')

    expect(occupiedFor(await listSplitters(), customerId)).toBe(1)

    await deleteNode(customer.id)

    expect(occupiedFor(await listSplitters(), customerId)).toBe(0)
  })
})

describe('install customer drop', () => {
  it('provisions a node-less subscriber and consumes a splitter port', async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less (prospek) subscriber')
    const odp = (await listTopology()).items.find(
      (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
    )
    if (!odp) throw new Error('no ODP with a free port')
    const before = odp.meta?.portsUsed ?? 0

    const node = await installCustomerDrop({
      customerId: candidate.id,
      odpId: odp.id,
      lat: odp.lat,
      lng: odp.lng,
    })
    expect(node.id).toBe(`${candidate.id}-node`)
    expect(node.meta?.customerId).toBe(candidate.id)

    const odpAfter = (await listTopology()).items.find((n) => n.id === odp.id)
    expect(odpAfter?.meta?.portsUsed).toBe(before + 1)
  })

  it('rejects a customer already on the map', async () => {
    const topo = await listTopology()
    const existing = topo.items.find((n) => n.type === 'customer' && n.meta?.customerId)
    const odp = topo.items.find((n) => n.type === 'odp')
    if (!existing?.meta?.customerId || !odp) {
      throw new Error('seed missing customer/odp')
    }

    await expect(
      installCustomerDrop({
        customerId: existing.meta.customerId,
        odpId: odp.id,
        lat: odp.lat,
        lng: odp.lng,
      }),
    ).rejects.toThrow()
  })
})
