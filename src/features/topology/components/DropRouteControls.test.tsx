import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listCables } from '@/api/cabling'
import { listTopology } from '@/api/topology'
import type { NetworkNode } from '@/schemas/topology'
import { renderWithProviders } from '@/test/helpers'

import { DropRouteControls } from './DropRouteControls'

describe('DropRouteControls', () => {
  it('shows the drop route length + editor buttons for a customer', async () => {
    // A seeded customer node that has a drop cable.
    const cable = (await listCables()).items[0]
    if (!cable) throw new Error('seed has no drop cable')
    const node = (await listTopology()).items.find((n) => n.id === cable.toNodeId)
    if (!node) throw new Error('drop cable has no customer node')

    renderWithProviders(<DropRouteControls node={node} />)

    expect(await screen.findByText('Rute drop')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tambah belokan/ })).toBeInTheDocument()
    // a straight (2-point) route can't be straightened further
    expect(screen.getByRole('button', { name: /Luruskan/ })).toBeDisabled()
  })

  it('renders nothing for a non-customer node', () => {
    const odp: NetworkNode = {
      id: 'odp-x',
      name: 'ODP X',
      type: 'odp',
      status: 'up',
      lat: -6.55,
      lng: 110.68,
      parentId: 'odc-1',
    }
    const { container } = renderWithProviders(<DropRouteControls node={odp} />)
    expect(container).toBeEmptyDOMElement()
  })
})
