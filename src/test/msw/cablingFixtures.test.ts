import { describe, expect, it } from 'vitest'

import { projectNodeMeta } from '@/features/topology/lib/projection'
import type { NetworkNode } from '@/schemas/topology'

import { allocateDrop, deriveCabling, freeDrop } from './cablingFixtures'

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

describe('deriveCabling', () => {
  it('builds a splitter per ODC/ODP and a drop strand + cable + circuit per customer', () => {
    const c = deriveCabling(network())
    expect(c.splitters).toHaveLength(2) // ODC (1:4) + ODP (1:8)
    expect(c.strands).toHaveLength(2)
    expect(c.cables).toHaveLength(2)
    expect(c.circuits).toHaveLength(2)
    expect(c.closures).toHaveLength(2)
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

    freeDrop(store, 'c3', 'c3-node')
    expect(occupied()).toBe(2)
    expect(store.cables.some((c) => c.toNodeId === 'c3-node')).toBe(false)
    expect(store.circuits.some((c) => c.customerId === 'c3')).toBe(false)
  })
})
