import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'

import type { ProbableFault } from '../lib/faults'
import { FaultDiagnosis } from './FaultDiagnosis'

const odp: NetworkNode = {
  id: 'odp-1',
  name: 'ODP Mawar',
  type: 'odp',
  status: 'down',
  lat: -6.55,
  lng: 110.68,
  parentId: 'odc-1',
}

const fault: ProbableFault = {
  node: odp,
  downCount: 5,
  totalCount: 6,
  confidence: 'confirmed',
}

describe('FaultDiagnosis', () => {
  it('renders nothing when there are no faults', () => {
    const { container } = render(<FaultDiagnosis faults={[]} onSelect={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists a probable fault and focuses it on click', () => {
    const onSelect = vi.fn()
    render(<FaultDiagnosis faults={[fault]} onSelect={onSelect} />)
    expect(screen.getByText('Diagnosa gangguan')).toBeInTheDocument()
    expect(screen.getByText(/ODP · ODP Mawar/)).toBeInTheDocument()
    expect(screen.getByText(/Terkonfirmasi padam · 5\/6 pelanggan padam/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('odp-1')
  })
})
