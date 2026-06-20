import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listCables } from '@/api/cabling'
import type { NetworkNode } from '@/schemas/topology'
import { renderWithProviders } from '@/test/helpers'

import { NodeCablesPanel } from './NodeCablesPanel'

function node(id: string): NetworkNode {
  return {
    id,
    name: id,
    type: 'odp',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: null,
  }
}

// A node that actually has at least one cable touching it.
async function nodeWithCable(): Promise<string> {
  const cable = (await listCables()).items[0]
  expect(cable).toBeDefined()
  return cable?.fromNodeId ?? ''
}

describe('NodeCablesPanel', () => {
  it('lists the cables touching the node', async () => {
    const id = await nodeWithCable()
    renderWithProviders(<NodeCablesPanel node={node(id)} byId={new Map()} canManage={false} />)
    expect(await screen.findByText(/Kabel \(/)).toBeInTheDocument()
  })

  it('exposes an edit control only with manage rights', async () => {
    const id = await nodeWithCable()
    const { unmount } = renderWithProviders(
      <NodeCablesPanel node={node(id)} byId={new Map()} canManage />,
    )
    expect((await screen.findAllByRole('button', { name: 'Edit kabel' })).length).toBeGreaterThan(0)
    unmount()

    renderWithProviders(<NodeCablesPanel node={node(id)} byId={new Map()} canManage={false} />)
    await screen.findByText(/Kabel \(/)
    expect(screen.queryByRole('button', { name: 'Edit kabel' })).not.toBeInTheDocument()
  })

  it('renders nothing for a node with no cables', () => {
    const { container } = renderWithProviders(
      <NodeCablesPanel node={node('no-cable-node')} byId={new Map()} canManage />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
