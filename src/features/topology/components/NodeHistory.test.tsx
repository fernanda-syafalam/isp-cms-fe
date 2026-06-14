import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createNode } from '@/api/topology'
import { renderWithProviders } from '@/test/helpers'

import { NodeHistory } from './NodeHistory'

describe('NodeHistory', () => {
  it('shows an empty state for a node with no recorded changes', async () => {
    renderWithProviders(<NodeHistory nodeId="no-such-node" />)
    expect(await screen.findByText('Belum ada perubahan tercatat.')).toBeInTheDocument()
  })

  it("lists a node's recorded change", async () => {
    const node = await createNode({
      name: 'ODP Riwayat',
      type: 'odp',
      status: 'up',
      parentId: null,
      lat: -6.55,
      lng: 110.68,
    })
    renderWithProviders(<NodeHistory nodeId={node.id} />)
    expect(await screen.findByText(/ditambahkan/)).toBeInTheDocument()
  })
})
