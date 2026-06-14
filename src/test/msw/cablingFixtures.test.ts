import { describe, expect, it } from 'vitest'

import { projectNodeMeta } from '@/features/topology/lib/projection'
import type { NetworkNode } from '@/schemas/topology'

import {
  allocateDrop,
  deriveCabling,
  freeDrop,
  rehomeCustomerDrop,
  syncNodeGeometry,
} from './cablingFixtures'

// OLT → ODC → ODP → pole → {c1, c2}. Customers hang off the pole; the serving
// ODP is the pole's parent (the nearest-ODP-ancestor case).
function network(): NetworkNode[] {
  return [
    {
      id: 'olt-1',
      name: 'OLT',
      type: 'olt',
      status: 'up',
      lat: 0,
      lng: 0,
      parentId: null,
    },
    {
      id: 'odc-1',
      name: 'ODC',
      type: 'odc',
      status: 'up',
      lat: 0.01,
      lng: 0.01,
      parentId: 'olt-1',
    },
    {
      id: 'odp-1',
      name: 'ODP',
      type: 'odp',
      status: 'up',
      lat: 0.02,
      lng: 0.02,
      parentId: 'odc-1',
    },
    {
      id: 'pole-1',
      name: 'Tiang',
      type: 'pole',
      status: 'up',
      lat: 0.03,
      lng: 0.03,
      parentId: 'odp-1',
    },
    {
      id: 'c1-node',
      name: 'C1',
      type: 'customer',
      status: 'up',
      lat: 0.031,
      lng: 0.031,
      parentId: 'pole-1',
      meta: { customerId: 'c1', coreNo: 1 },
    },
    {
      id: 'c2-node',
      name: 'C2',
      type: 'customer',
      status: 'up',
      lat: 0.032,
      lng: 0.032,
      parentId: 'pole-1',
      meta: { customerId: 'c2', coreNo: 2 },
    },
  ]
}

function odpFrom(nodes: NetworkNode[]): NetworkNode {
  const odp = nodes.find((n) => n.id === 'odp-1')
  if (!odp) throw new Error('fixture missing odp-1')
  return odp
}

function c1From(nodes: NetworkNode[]): NetworkNode {
  const c1 = nodes.find((n) => n.id === 'c1-node')
  if (!c1) throw new Error('fixture missing c1-node')
  return c1
}

describe('deriveCabling', () => {
  it('builds a splitter per ODC/ODP and a drop strand + cable + circuit per customer', () => {
    const c = deriveCabling(network())
    expect(c.splitters).toHaveLength(2) // ODC (1:4) + ODP (1:8)
    expect(c.strands).toHaveLength(2)
    expect(c.cables).toHaveLength(2)
    expect(c.circuits).toHaveLength(2)
    expect(c.closures).toHaveLength(2)
    expect(c.splices).toHaveLength(2) // one fusion splice per customer drop
    // each splice lives in its serving ODP's closure and joins to the drop core
    expect(c.splices.every((s) => s.closureId === 'odp-1-closure')).toBe(true)
  })

  it('projected portsUsed equals the real downstream count (occupancy invariant)', () => {
    const nodes = network()
    const c = deriveCabling(nodes)
    const projected = projectNodeMeta(nodes, {
      splitters: c.splitters,
      strands: c.strands,
    })
    const odp = projected.find((n) => n.id === 'odp-1')
    expect(odp?.meta?.portsUsed).toBe(2) // 2 customers
    expect(odp?.meta?.portsTotal).toBe(8)
    const odc = projected.find((n) => n.id === 'odc-1')
    expect(odc?.meta?.portsUsed).toBe(1) // 1 ODP child
    expect(odc?.meta?.portsTotal).toBe(4)
  })

  it('allocateDrop consumes a free port and freeDrop releases it', () => {
    const nodes = network()
    const store = deriveCabling(nodes)
    const occupied = () =>
      store.splitters.find((s) => s.nodeId === 'odp-1')?.ports.filter((p) => p.outNodeId !== null)
        .length

    expect(occupied()).toBe(2)
    const result = allocateDrop(
      store,
      nodes,
      odpFrom(nodes),
      { id: 'c3-node', lat: 0.033, lng: 0.033, customerId: 'c3' },
      {},
    )
    expect(result?.coreNo).toBe(3)
    expect(occupied()).toBe(3)
    expect(store.cables.some((c) => c.toNodeId === 'c3-node')).toBe(true)
    expect(store.splices).toHaveLength(3) // a splice was added for the new drop

    freeDrop(store, 'c3', 'c3-node')
    expect(occupied()).toBe(2)
    expect(store.cables.some((c) => c.toNodeId === 'c3-node')).toBe(false)
    expect(store.circuits.some((c) => c.customerId === 'c3')).toBe(false)
    expect(store.splices).toHaveLength(2) // and removed on free
  })
})

describe('syncNodeGeometry', () => {
  it('recomputes a moved customer drop cable route + length', () => {
    const nodes = network()
    const store = deriveCabling(nodes)
    const cable = store.cables.find((c) => c.toNodeId === 'c1-node')
    if (!cable) throw new Error('no drop cable for c1')
    const before = cable.lengthM

    // Drag the customer far away, then re-sync from the moved node.
    const c1 = nodes.find((n) => n.id === 'c1-node')
    if (!c1) throw new Error('no c1 node')
    c1.lat = 0.09
    c1.lng = 0.09
    syncNodeGeometry(store, nodes, c1)

    expect(cable.lengthM).not.toBe(before)
    expect(cable.lengthM).toBeGreaterThan(before)
    expect(cable.route.at(-1)).toEqual({ lat: 0.09, lng: 0.09 })
  })
})

// OLT → ODC → {odp-1 (pole-1 → c1), odp-2}. Lets a customer re-home odp-1→odp-2.
function twoOdpNetwork(): NetworkNode[] {
  return [
    ...network(),
    {
      id: 'odp-2',
      name: 'ODP 2',
      type: 'odp',
      status: 'up',
      lat: 0.05,
      lng: 0.05,
      parentId: 'odc-1',
    },
  ]
}

describe('rehomeCustomerDrop', () => {
  const occupied = (store: ReturnType<typeof deriveCabling>, odpId: string): number =>
    store.splitters.find((s) => s.nodeId === odpId)?.ports.filter((p) => p.outNodeId !== null)
      .length ?? 0

  it('moves a customer port from the old ODP to the new serving ODP', () => {
    const nodes = twoOdpNetwork()
    const store = deriveCabling(nodes)
    expect(occupied(store, 'odp-1')).toBe(2)
    expect(occupied(store, 'odp-2')).toBe(0)

    // c1 now hangs directly off odp-2 (its new serving ODP).
    const moved: NetworkNode = { ...c1From(nodes), parentId: 'odp-2' }
    const res = rehomeCustomerDrop(store, nodes, moved, {})

    expect(res.status).toBe('rehomed')
    expect(occupied(store, 'odp-1')).toBe(1) // c1 released
    expect(occupied(store, 'odp-2')).toBe(1) // c1 re-allocated
    expect(
      store.splitters.find((s) => s.nodeId === 'odp-2')?.ports.some((p) => p.customerId === 'c1'),
    ).toBe(true)
  })

  it('is a no-op when the serving ODP is unchanged', () => {
    const nodes = twoOdpNetwork()
    const store = deriveCabling(nodes)
    expect(rehomeCustomerDrop(store, nodes, c1From(nodes), {}).status).toBe('unchanged')
  })

  it('reports no-odp when the new uplink has no ODP ancestor', () => {
    const nodes = twoOdpNetwork()
    const store = deriveCabling(nodes)
    const orphan: NetworkNode = { ...c1From(nodes), parentId: 'olt-1' }
    expect(rehomeCustomerDrop(store, nodes, orphan, {}).status).toBe('no-odp')
  })

  it('reports full (no mutation) when the target ODP splitter is full', () => {
    const nodes = twoOdpNetwork()
    const store = deriveCabling(nodes)
    // Fill every port of odp-2.
    const sp2 = store.splitters.find((s) => s.nodeId === 'odp-2')
    for (const p of sp2?.ports ?? []) p.outNodeId = 'x'
    const before = occupied(store, 'odp-1')

    const moved: NetworkNode = { ...c1From(nodes), parentId: 'odp-2' }
    expect(rehomeCustomerDrop(store, nodes, moved, {}).status).toBe('full')
    // old ODP untouched — the rejected rehome must not free the existing port
    expect(occupied(store, 'odp-1')).toBe(before)
  })
})
