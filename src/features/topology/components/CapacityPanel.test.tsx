import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import { CapacityPanel } from './CapacityPanel'
import type { OdpCapacity } from '../lib/graph'

const odp: NetworkNode = {
  id: 'odp-1',
  name: 'ODP Melati',
  type: 'odp',
  status: 'up',
  lat: -6.55,
  lng: 110.68,
  parentId: 'odc-1',
}

const item: OdpCapacity = { node: odp, used: 7, total: 8, pct: 88 }

describe('CapacityPanel', () => {
  it('renders nothing when no ODP is near full', () => {
    const { container } = render(<CapacityPanel items={[]} onSelect={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists a near-full ODP with its free count and focuses it on click', () => {
    const onSelect = vi.fn()
    render(<CapacityPanel items={[item]} onSelect={onSelect} />)
    expect(screen.getByText('Kapasitas ODP')).toBeInTheDocument()
    expect(screen.getByText('ODP Melati')).toBeInTheDocument()
    expect(screen.getByText(/7\/8 · sisa 1/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('odp-1')
  })
})
