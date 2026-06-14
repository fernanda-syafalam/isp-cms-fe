import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { NodeFormDialog } from './NodeFormDialog'

describe('NodeFormDialog (add)', () => {
  it('defaults to ODP and shows infra + coordinate fields', () => {
    renderWithProviders(
      <NodeFormDialog
        open
        onOpenChange={vi.fn()}
        nodes={[]}
        latLng={{ lat: -6.55, lng: 110.68 }}
      />,
    )
    expect(screen.getByText('Tambah node')).toBeInTheDocument()
    // default type is ODP → the splitter-ratio field (gap #1) is shown
    expect(screen.getByText('Rasio splitter')).toBeInTheDocument()
    // editable coordinates (gap #3)
    expect(screen.getByText('Lat')).toBeInTheDocument()
    expect(screen.getByText('Lng')).toBeInTheDocument()
  })
})
