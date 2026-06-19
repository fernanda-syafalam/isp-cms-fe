import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import type { ProbableFault } from './faults'
import { toFaultHotspots } from './faultHeat'

function rootNode(id: string, lat: number, lng: number): NetworkNode {
  return {
    id,
    name: id,
    type: 'odp',
    status: 'down',
    lat,
    lng,
    parentId: 'odc-1',
  }
}

function fault(
  partial: Partial<ProbableFault> & Pick<ProbableFault, 'node' | 'downCount'>,
): ProbableFault {
  return {
    node: partial.node,
    downCount: partial.downCount,
    totalCount: partial.totalCount ?? partial.downCount,
    confidence: partial.confidence ?? 'confirmed',
  }
}

describe('toFaultHotspots', () => {
  it('returns nothing for no faults', () => {
    expect(toFaultHotspots([])).toEqual([])
  })

  it("carries the root node's coordinates, counts, and confidence through", () => {
    const node = rootNode('odp-1', -6.55, 110.68)
    const [hotspot] = toFaultHotspots([
      fault({ node, downCount: 4, totalCount: 6, confidence: 'likely' }),
    ])
    expect(hotspot).toMatchObject({
      id: 'odp-1',
      lat: -6.55,
      lng: 110.68,
      downCount: 4,
      totalCount: 6,
      confidence: 'likely',
    })
  })

  it('grows the halo radius with the number of dark customers', () => {
    const small = toFaultHotspots([fault({ node: rootNode('a', 0, 0), downCount: 1 })])[0]
    const big = toFaultHotspots([fault({ node: rootNode('b', 0, 0), downCount: 10 })])[0]
    expect(big?.radiusPx).toBeGreaterThan(small?.radiusPx ?? 0)
  })

  it('caps the radius so a whole-OLT outage never blankets the map', () => {
    const huge = toFaultHotspots([fault({ node: rootNode('olt', 0, 0), downCount: 500 })])[0]
    expect(huge?.radiusPx).toBe(44)
  })

  it('preserves the incoming fault order (confirmed first, then blast size)', () => {
    const hotspots = toFaultHotspots([
      fault({ node: rootNode('first', 0, 0), downCount: 2 }),
      fault({ node: rootNode('second', 0, 0), downCount: 9 }),
    ])
    expect(hotspots.map((h) => h.id)).toEqual(['first', 'second'])
  })
})
