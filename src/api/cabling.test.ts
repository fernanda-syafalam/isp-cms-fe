import { describe, expect, it } from 'vitest'

import { installCustomerDrop, listSplitters } from './cabling'
import { listCustomers } from './customers'
import { createNode, deleteNode, listTopology, updateNode } from './topology'

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

  it('allocates the exact splitter port the technician picked', async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less (prospek) subscriber')
    const odp = (await listTopology()).items.find(
      (n) => n.type === 'odp' && (n.meta?.portsTotal ?? 0) > (n.meta?.portsUsed ?? 0),
    )
    if (!odp) throw new Error('no ODP with a free port')
    const sp = (await listSplitters()).items.find((s) => s.nodeId === odp.id)
    const free = sp?.ports.filter((p) => p.outNodeId === null) ?? []
    // pick the LAST free port to prove allocation honors the choice, not just first-free
    const chosen = free[free.length - 1]
    if (!chosen) throw new Error('odp has no free port')

    const node = await installCustomerDrop({
      customerId: candidate.id,
      odpId: odp.id,
      lat: odp.lat,
      lng: odp.lng,
      portNo: chosen.portNo,
    })
    expect(node.meta?.coreNo).toBe(chosen.portNo)

    const spAfter = (await listSplitters()).items.find((s) => s.nodeId === odp.id)
    const occupied = spAfter?.ports.find((p) => p.portNo === chosen.portNo)
    expect(occupied?.customerId).toBe(candidate.id)
  })

  it('rejects a port that is already taken', async () => {
    const candidate = (await listCustomers({ status: 'prospek' })).items[0]
    if (!candidate) throw new Error('seed has no node-less (prospek) subscriber')
    const topo = await listTopology()
    const odpType = new Set(topo.items.filter((n) => n.type === 'odp').map((n) => n.id))
    const taken = (await listSplitters()).items
      .filter((s) => odpType.has(s.nodeId))
      .flatMap((s) => s.ports.filter((p) => p.outNodeId !== null).map((p) => ({ s, p })))[0]
    if (!taken) throw new Error('no occupied ODP port in seed')
    const odp = topo.items.find((n) => n.id === taken.s.nodeId)

    await expect(
      installCustomerDrop({
        customerId: candidate.id,
        odpId: taken.s.nodeId,
        lat: odp?.lat ?? 0,
        lng: odp?.lng ?? 0,
        portNo: taken.p.portNo,
      }),
    ).rejects.toThrow()
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

describe('infra node provisioning (form directives)', () => {
  it('creates an ODP with the chosen splitter ratio', async () => {
    const olt = (await listTopology()).items.find((n) => n.type === 'olt')
    const node = await createNode({
      name: 'ODP Baru',
      type: 'odp',
      status: 'up',
      parentId: olt?.id ?? null,
      lat: -6.55,
      lng: 110.68,
      splitterRatio: '1:16',
    })
    const sp = (await listSplitters()).items.find((s) => s.nodeId === node.id)
    expect(sp?.ratio).toBe('1:16')
    expect(sp?.ports).toHaveLength(16)
  })

  it('stores OLT ip/model on create and preserves model on a partial edit', async () => {
    const node = await createNode({
      name: 'OLT Baru',
      type: 'olt',
      status: 'up',
      parentId: null,
      lat: -6.55,
      lng: 110.68,
      ipAddress: '10.9.9.9',
      model: 'ZTE C320',
    })
    const created = (await listTopology()).items.find((n) => n.id === node.id)
    expect(created?.meta?.ipAddress).toBe('10.9.9.9')
    expect(created?.meta?.model).toBe('ZTE C320')

    await updateNode(node.id, { ipAddress: '10.1.1.1' })
    const updated = (await listTopology()).items.find((n) => n.id === node.id)
    expect(updated?.meta?.ipAddress).toBe('10.1.1.1')
    expect(updated?.meta?.model).toBe('ZTE C320')
  })
})
