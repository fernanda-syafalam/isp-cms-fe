import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { NetworkNode } from '@/schemas/topology'
import { renderWithProviders } from '@/test/helpers'

import { MaintenanceButton } from './MaintenanceButton'

function odp(maintenance: boolean): NetworkNode {
  return {
    id: 'odp-1',
    name: 'ODP 1',
    type: 'odp',
    status: 'up',
    lat: -6.55,
    lng: 110.68,
    parentId: 'olt-1',
    meta: { maintenance },
  }
}

describe('MaintenanceButton', () => {
  it('offers to start maintenance when the node is operational', () => {
    renderWithProviders(<MaintenanceButton node={odp(false)} />)
    expect(screen.getByRole('button', { name: 'Tandai pemeliharaan' })).toBeInTheDocument()
  })

  it('offers to end maintenance when the node is already flagged', () => {
    renderWithProviders(<MaintenanceButton node={odp(true)} />)
    expect(screen.getByRole('button', { name: 'Akhiri pemeliharaan' })).toBeInTheDocument()
  })
})
