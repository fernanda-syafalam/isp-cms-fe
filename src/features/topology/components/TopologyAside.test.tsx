import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'
import { renderWithProviders } from '@/test/helpers'

import { TopologyAside } from './TopologyAside'

// Drive the breakpoint per test without a real viewport.
const { mobile } = vi.hoisted(() => ({ mobile: { value: false } }))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobile.value }))

const OLT: NetworkNode = {
  id: 'olt-1',
  name: 'OLT 1',
  type: 'olt',
  status: 'up',
  lat: -6.55,
  lng: 110.68,
  parentId: null,
}
const ODP: NetworkNode = {
  id: 'odp-1',
  name: 'ODP 1',
  type: 'odp',
  status: 'up',
  lat: -6.552,
  lng: 110.682,
  parentId: 'olt-1',
  meta: { splitter: '1:8', portsUsed: 4, portsTotal: 8 },
}
const NODES = [OLT, ODP]
const byId = new Map(NODES.map((n) => [n.id, n]))

function setup(selected: NetworkNode | null) {
  return renderWithProviders(
    <TopologyAside
      selected={selected}
      byId={byId}
      nodes={NODES}
      editMode={false}
      nearestOdp={null}
      onClear={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onPickNearest={vi.fn()}
    />,
  )
}

describe('TopologyAside', () => {
  it('desktop: shows the legend inline when nothing is selected', () => {
    mobile.value = false
    setup(null)
    expect(screen.getByText('Legenda peta')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('desktop: shows the node detail inline (no dialog) when selected', () => {
    mobile.value = false
    setup(ODP)
    expect(screen.getByText('Jalur uplink')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mobile: slides the node detail up in a bottom sheet on selection', () => {
    mobile.value = true
    setup(ODP)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Jalur uplink')).toBeInTheDocument()
  })

  it('mobile: no detail dialog when nothing is selected, legend still visible', () => {
    mobile.value = true
    setup(null)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Legenda peta')).toBeInTheDocument()
  })
})
