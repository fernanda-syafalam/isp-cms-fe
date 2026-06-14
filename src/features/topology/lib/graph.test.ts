import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import {
  buildForest,
  downstreamIds,
  fiberCore,
  fiberId,
  formatLength,
  impactedCustomerIds,
  indexById,
  linkBudget,
  nearestFreeOdp,
  ratioCount,
  segmentMeters,
  uplinkPath,
} from './graph'

// A small but complete OLT → ODC → ODP → pole → customer network. Coordinates
// are clustered around Jepara so segment distances stay realistic (sub-km).
function node(partial: Partial<NetworkNode> & Pick<NetworkNode, 'id' | 'type'>): NetworkNode {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    type: partial.type,
    status: partial.status ?? 'up',
    lat: partial.lat ?? -6.55,
    lng: partial.lng ?? 110.68,
    parentId: partial.parentId ?? null,
    ...(partial.meta ? { meta: partial.meta } : {}),
  }
}

function sampleNetwork(): NetworkNode[] {
  return [
    node({ id: 'olt-1', type: 'olt', lat: -6.55, lng: 110.68, parentId: null }),
    node({
      id: 'odc-1',
      type: 'odc',
      lat: -6.551,
      lng: 110.681,
      parentId: 'olt-1',
      meta: { splitter: '1:4', portsUsed: 2, portsTotal: 4 },
    }),
    node({
      id: 'odp-1',
      type: 'odp',
      lat: -6.552,
      lng: 110.682,
      parentId: 'odc-1',
      meta: { splitter: '1:8', portsUsed: 4, portsTotal: 8 },
    }),
    node({
      id: 'odp-2',
      type: 'odp',
      lat: -6.553,
      lng: 110.683,
      parentId: 'odc-1',
      meta: { splitter: '1:8', portsUsed: 8, portsTotal: 8 },
    }),
    node({
      id: 'pole-1',
      type: 'pole',
      lat: -6.5525,
      lng: 110.6825,
      parentId: 'odp-1',
    }),
    node({
      id: 'cust-1',
      type: 'customer',
      status: 'up',
      lat: -6.5526,
      lng: 110.6826,
      parentId: 'pole-1',
      meta: { coreNo: 1 },
    }),
    node({
      id: 'cust-2',
      type: 'customer',
      status: 'down',
      lat: -6.5527,
      lng: 110.6827,
      parentId: 'pole-1',
      meta: { coreNo: 2 },
    }),
  ]
}

describe('indexById', () => {
  it('maps each node id to its node for O(1) lookup', () => {
    const byId = indexById(sampleNetwork())
    expect(byId.size).toBe(7)
    expect(byId.get('odp-1')?.type).toBe('odp')
    expect(byId.get('missing')).toBeUndefined()
  })
})

describe('segmentMeters / formatLength', () => {
  it('computes a positive haversine distance between two coordinates', () => {
    const meters = segmentMeters({ lat: -6.55, lng: 110.68 }, { lat: -6.552, lng: 110.682 })
    // ~314 m for ~0.002° diagonal near the equator-ish latitude.
    expect(meters).toBeGreaterThan(250)
    expect(meters).toBeLessThan(400)
  })

  it('returns 0 for identical points', () => {
    expect(segmentMeters({ lat: -6.55, lng: 110.68 }, { lat: -6.55, lng: 110.68 })).toBe(0)
  })

  it('formats sub-km as meters and >=1km as km with two decimals', () => {
    expect(formatLength(0)).toBe('0 m')
    expect(formatLength(850)).toBe('850 m')
    expect(formatLength(1000)).toBe('1.00 km')
    expect(formatLength(2540)).toBe('2.54 km')
  })
})

describe('fiberCore / fiberId (TIA-598-C)', () => {
  it('maps core numbers to colors and cycles every 12', () => {
    expect(fiberCore(1).name).toBe('Biru')
    expect(fiberCore(12).name).toBe('Aqua')
    expect(fiberCore(13).name).toBe('Biru') // cycles
  })

  it('resolves a global fiber number to its tube + in-tube core', () => {
    const first = fiberId(1)
    expect(first.tubeNo).toBe(1)
    expect(first.tube.name).toBe('Biru')
    expect(first.coreNo).toBe(1)
    expect(first.core.name).toBe('Biru')

    // Core 13 = tube 2 (Oranye), first strand within that tube (Biru).
    const second = fiberId(13)
    expect(second.tubeNo).toBe(2)
    expect(second.tube.name).toBe('Oranye')
    expect(second.coreNo).toBe(1)
    expect(second.core.name).toBe('Biru')
  })
})

describe('buildForest', () => {
  it('builds the OLT-rooted hierarchy from parentId links', () => {
    const forest = buildForest(sampleNetwork())
    expect(forest).toHaveLength(1)
    const olt = forest[0]
    expect(olt?.node.id).toBe('olt-1')
    expect(olt?.children).toHaveLength(1) // odc-1
    const odc = olt?.children[0]
    expect(odc?.node.id).toBe('odc-1')
    expect(odc?.children.map((c) => c.node.id).sort()).toEqual(['odp-1', 'odp-2'])
  })

  it('treats nodes whose parent is absent from the set as roots', () => {
    const orphan = [node({ id: 'odp-x', type: 'odp', parentId: 'olt-gone' })]
    const forest = buildForest(orphan)
    expect(forest).toHaveLength(1)
    expect(forest[0]?.node.id).toBe('odp-x')
  })
})

describe('uplinkPath', () => {
  it('traces a node up to the OLT root, nearest first', () => {
    const nodes = sampleNetwork()
    const byId = indexById(nodes)
    const cust = byId.get('cust-1')
    if (!cust) throw new Error('fixture missing cust-1')
    expect(uplinkPath(cust, byId).map((n) => n.id)).toEqual([
      'cust-1',
      'pole-1',
      'odp-1',
      'odc-1',
      'olt-1',
    ])
  })
})

describe('downstreamIds', () => {
  it('returns every descendant of a node', () => {
    const ids = downstreamIds('odc-1', sampleNetwork())
    expect([...ids].sort()).toEqual(['cust-1', 'cust-2', 'odp-1', 'odp-2', 'pole-1'])
  })

  it('returns an empty set for a leaf', () => {
    expect(downstreamIds('cust-1', sampleNetwork()).size).toBe(0)
  })
})

describe('impactedCustomerIds (blast radius)', () => {
  it('counts a directly-down customer', () => {
    const ids = impactedCustomerIds(sampleNetwork())
    expect(ids.has('cust-2')).toBe(true) // down customer
    expect(ids.has('cust-1')).toBe(false) // up
  })

  it('counts every customer downstream of a down infra node', () => {
    const nodes = sampleNetwork().map((n) =>
      n.id === 'odp-1' ? { ...n, status: 'down' as const } : n,
    )
    const ids = impactedCustomerIds(nodes)
    expect(ids.has('cust-1')).toBe(true)
    expect(ids.has('cust-2')).toBe(true)
  })
})

describe('linkBudget (GPON Class B+)', () => {
  it('estimates loss within the 28 dB budget for a healthy short link', () => {
    const nodes = sampleNetwork()
    const byId = indexById(nodes)
    const cust = byId.get('cust-1')
    if (!cust) throw new Error('fixture missing cust-1')
    const budget = linkBudget(cust, byId)
    expect(budget.budgetDb).toBe(28)
    // 1:4 (7.2) + 1:8 (10.5) splitters + connectors dominate; short fiber adds little.
    expect(budget.lossDb).toBeGreaterThan(18)
    expect(budget.lossDb).toBeLessThan(28)
    expect(budget.marginDb).toBeCloseTo(budget.budgetDb - budget.lossDb, 1)
  })
})

describe('nearestFreeOdp', () => {
  const HERE = { lat: -6.5521, lng: 110.6821 }

  it('returns the nearest ODP that still has a free port', () => {
    const result = nearestFreeOdp(HERE, sampleNetwork())
    // odp-2 is full (8/8); odp-1 has 4/8 free, so it must be the answer.
    expect(result?.node.id).toBe('odp-1')
    expect(result?.meters).toBeGreaterThanOrEqual(0)
  })

  it('returns null when every ODP is full', () => {
    const full = sampleNetwork().map((n) =>
      n.type === 'odp' ? { ...n, meta: { ...n.meta, portsUsed: 8, portsTotal: 8 } } : n,
    )
    expect(nearestFreeOdp(HERE, full)).toBeNull()
  })

  it('ignores non-ODP node types', () => {
    const onlyCustomers = sampleNetwork().filter((n) => n.type === 'customer')
    expect(nearestFreeOdp(HERE, onlyCustomers)).toBeNull()
  })
})

describe('ratioCount', () => {
  it('returns the output-port count of a PON splitter ratio', () => {
    expect(ratioCount('1:8')).toBe(8)
    expect(ratioCount('1:4')).toBe(4)
    expect(ratioCount('1:64')).toBe(64)
  })

  it('returns 0 for an unparseable ratio', () => {
    expect(ratioCount('nonsense')).toBe(0)
  })
})
