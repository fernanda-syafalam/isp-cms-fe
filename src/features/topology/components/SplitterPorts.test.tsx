import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Splitter } from '@/schemas/splitter'
import type { NetworkNode } from '@/schemas/topology'

import { SplitterPorts } from './SplitterPorts'

const byId = new Map<string, NetworkNode>([
  [
    'odp-1',
    {
      id: 'odp-1',
      name: 'ODP 1',
      type: 'odp',
      status: 'up',
      lat: 0,
      lng: 0,
      parentId: 'odc-1',
    },
  ],
])

// An ODC splitter: port 1 feeds an ODP child (no customerId → no router Link).
const splitter: Splitter = {
  id: 's',
  nodeId: 'odc-1',
  ratio: '1:4',
  inCableId: null,
  inStrandId: null,
  ports: [
    { portNo: 1, outNodeId: 'odp-1', customerId: null, strandId: null },
    { portNo: 2, outNodeId: null, customerId: null, strandId: null },
    { portNo: 3, outNodeId: null, customerId: null, strandId: null },
    { portNo: 4, outNodeId: null, customerId: null, strandId: null },
  ],
}

describe('SplitterPorts', () => {
  it('lists the occupant per port and marks free ports "kosong"', () => {
    render(<SplitterPorts splitter={splitter} byId={byId} />)
    expect(screen.getByText('ODP 1')).toBeInTheDocument()
    expect(screen.getAllByText('kosong')).toHaveLength(3)
  })
})
