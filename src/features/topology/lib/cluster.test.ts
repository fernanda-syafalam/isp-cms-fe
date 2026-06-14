import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { clusterCellDeg, clusterPoints } from './cluster'

function cust(
  id: string,
  lat: number,
  lng: number,
  status: NetworkNode['status'] = 'up',
): NetworkNode {
  return {
    id,
    name: id,
    type: 'customer',
    status,
    lat,
    lng,
    parentId: 'odp-1',
  }
}

describe('clusterPoints', () => {
  it('passes everything through as singles when clustering is disabled', () => {
    const nodes = [cust('a', 0, 0), cust('b', 1, 1)]
    const { clusters, singles } = clusterPoints(nodes, 0)
    expect(clusters).toHaveLength(0)
    expect(singles).toHaveLength(2)
  })

  it('groups nodes that fall in the same grid cell into one cluster', () => {
    // a + b are within one 0.1° cell; c is far away (its own cell → single).
    const nodes = [
      cust('a', -6.55, 110.68),
      cust('b', -6.551, 110.681, 'down'),
      cust('c', -6.9, 111.2),
    ]
    const { clusters, singles } = clusterPoints(nodes, 0.1)
    expect(clusters).toHaveLength(1)
    expect(clusters[0]?.count).toBe(2)
    expect(clusters[0]?.ids.sort()).toEqual(['a', 'b'])
    expect(clusters[0]?.hasDown).toBe(true) // b is down
    expect(singles.map((s) => s.id)).toEqual(['c'])
  })

  it('clears hasDown when every member is up', () => {
    const { clusters } = clusterPoints([cust('a', 0, 0), cust('b', 0.001, 0.001)], 0.1)
    expect(clusters[0]?.hasDown).toBe(false)
  })
})

describe('clusterCellDeg', () => {
  it('is coarser when zoomed out and disabled when zoomed in', () => {
    expect(clusterCellDeg(10)).toBe(0.06)
    expect(clusterCellDeg(13)).toBe(0.015)
    expect(clusterCellDeg(15)).toBe(0) // close enough — no clustering
    expect(clusterCellDeg(18)).toBe(0)
  })
})
