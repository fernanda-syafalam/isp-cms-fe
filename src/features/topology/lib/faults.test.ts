import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { localizeFaults } from './faults'

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

const base = () => [
  node({ id: 'olt-1', type: 'olt' }),
  node({ id: 'odc-1', type: 'odc', parentId: 'olt-1' }),
]

function customers(odpId: string, statuses: NetworkNode['status'][]) {
  return statuses.map((status, i) =>
    node({
      id: `${odpId}-c${i + 1}`,
      type: 'customer',
      status,
      parentId: odpId,
      meta: { customerId: `${odpId}-c${i + 1}` },
    }),
  )
}

describe('localizeFaults', () => {
  it('returns nothing when no customer is dark', () => {
    const nodes = [
      ...base(),
      node({ id: 'odp-1', type: 'odp', parentId: 'odc-1' }),
      ...customers('odp-1', ['up', 'up', 'up']),
    ]
    expect(localizeFaults(nodes)).toEqual([])
  })

  it('flags an up ODP as a likely fault when most of its customers are dark', () => {
    const nodes = [
      ...base(),
      node({ id: 'odp-1', type: 'odp', parentId: 'odc-1' }),
      ...customers('odp-1', ['down', 'down', 'down', 'up']),
    ]
    const faults = localizeFaults(nodes)
    expect(faults).toHaveLength(1)
    expect(faults[0]?.node.id).toBe('odp-1')
    expect(faults[0]?.confidence).toBe('likely')
    expect(faults[0]?.downCount).toBe(3)
    expect(faults[0]?.totalCount).toBe(4)
  })

  it('does not flag a lone dead ONU (a CPE issue, no upstream root)', () => {
    const nodes = [
      ...base(),
      node({ id: 'odp-1', type: 'odp', parentId: 'odc-1' }),
      ...customers('odp-1', ['down', 'up', 'up']),
    ]
    expect(localizeFaults(nodes)).toEqual([])
  })

  it('reports a down ODP precisely without blaming the healthy ODC above it', () => {
    const nodes = [
      ...base(),
      node({ id: 'odp-1', type: 'odp', status: 'down', parentId: 'odc-1' }),
      ...customers('odp-1', ['up', 'up']), // dark because their ODP is down
      node({ id: 'odp-2', type: 'odp', parentId: 'odc-1' }),
      ...customers('odp-2', ['up']),
    ]
    const faults = localizeFaults(nodes)
    expect(faults).toHaveLength(1)
    expect(faults[0]?.node.id).toBe('odp-1')
    expect(faults[0]?.confidence).toBe('confirmed')
    expect(faults[0]?.downCount).toBe(2)
  })

  it('rolls a down ODC up: it explains the ODPs beneath it (one entry)', () => {
    const nodes = [
      ...base().map((n) => (n.id === 'odc-1' ? { ...n, status: 'down' as const } : n)),
      node({ id: 'odp-1', type: 'odp', status: 'down', parentId: 'odc-1' }),
      ...customers('odp-1', ['up', 'up']),
      node({ id: 'odp-2', type: 'odp', parentId: 'odc-1' }),
      ...customers('odp-2', ['up']),
    ]
    const faults = localizeFaults(nodes)
    expect(faults).toHaveLength(1)
    expect(faults[0]?.node.id).toBe('odc-1')
    expect(faults[0]?.confidence).toBe('confirmed')
    expect(faults[0]?.downCount).toBe(3) // all customers under the ODC
  })
})
