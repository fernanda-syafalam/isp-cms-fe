import { describe, expect, it } from 'vitest'

import { installCustomerDrop, listCables, listSplitters } from './cabling'
import { listCustomers } from './customers'
import { listTopology, updateNode } from './topology'

// Integration over the MSW layer: editing a topology node must keep the cabling
// layer consistent — a moved node re-syncs its stored drop-cable length, and a
// re-homed customer shifts its splitter port to the new serving ODP.
describe('topology edit keeps cabling consistent', () => {
  it('re-syncs the drop cable length when a customer node is dragged', async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less subscriber')
    const odp = (await listTopology()).items.find(
      (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
    )
    if (!odp) throw new Error('no ODP with a free port')

    const node = await installCustomerDrop({
      customerId: candidate.id,
      odpId: odp.id,
      lat: odp.lat + 0.0005,
      lng: odp.lng + 0.0005,
    })
    const cableBefore = (await listCables()).items.find((c) => c.toNodeId === node.id)
    if (!cableBefore) throw new Error('install created no drop cable')

    // Drag the customer ~3 km away.
    await updateNode(node.id, { lat: odp.lat + 0.03, lng: odp.lng + 0.03 })

    const cableAfter = (await listCables()).items.find((c) => c.toNodeId === node.id)
    expect(cableAfter?.lengthM).toBeGreaterThan(cableBefore.lengthM)
    expect(cableAfter?.route.at(-1)).toEqual({
      lat: odp.lat + 0.03,
      lng: odp.lng + 0.03,
    })
  })

  it("re-homes a customer's splitter port when its ODP changes", async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less subscriber')
    const odps = (await listTopology()).items.filter(
      (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
    )
    const odpA = odps[0]
    const odpB = odps[1]
    if (!odpA || !odpB) throw new Error('need two ODPs with free ports')

    const node = await installCustomerDrop({
      customerId: candidate.id,
      odpId: odpA.id,
      lat: odpA.lat,
      lng: odpA.lng,
    })

    const usedOn = async (odpId: string) =>
      (await listSplitters()).items
        .find((s) => s.nodeId === odpId)
        ?.ports.filter((p) => p.customerId === candidate.id).length ?? 0

    expect(await usedOn(odpA.id)).toBe(1)
    expect(await usedOn(odpB.id)).toBe(0)

    await updateNode(node.id, { parentId: odpB.id })

    expect(await usedOn(odpA.id)).toBe(0) // released from A
    expect(await usedOn(odpB.id)).toBe(1) // re-allocated on B
  })
})
