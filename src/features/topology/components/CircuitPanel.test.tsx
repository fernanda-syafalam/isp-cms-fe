import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listCircuits } from '@/api/cabling'
import type { NetworkNode } from '@/schemas/topology'
import { renderWithProviders } from '@/test/helpers'

import { CircuitPanel } from './CircuitPanel'

function customerNode(id: string): NetworkNode {
  return {
    id,
    name: id,
    type: 'customer',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: 'odp-1',
  }
}

describe('CircuitPanel', () => {
  it("shows the selected subscriber's optical circuit (OLT port + status)", async () => {
    const circuit = (await listCircuits()).items[0]
    expect(circuit).toBeDefined()
    renderWithProviders(<CircuitPanel node={customerNode(circuit?.customerNodeId ?? '')} />)

    expect(await screen.findByText('Sirkuit optik')).toBeInTheDocument()
    expect(screen.getByText('Port PON (OLT)')).toBeInTheDocument()
    expect(screen.getByText(circuit?.oltPonPort ?? '')).toBeInTheDocument()
  })

  it('renders nothing for a node with no circuit', () => {
    const { container } = renderWithProviders(
      <CircuitPanel node={customerNode('no-circuit-node')} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
