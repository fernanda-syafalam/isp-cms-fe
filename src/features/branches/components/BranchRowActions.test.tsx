import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { Branch } from '@/schemas/branch'
import { renderWithProviders } from '@/test/helpers'

import { BranchRowActions } from './BranchRowActions'

const branch: Branch = {
  id: 'b1',
  name: 'Cabang Demak',
  city: 'Demak',
  manager: 'Budi',
  phone: '0291-000',
  status: 'active',
  isHeadOffice: false,
  customerCount: 10,
  mrr: 1_000_000,
  deviceCount: 2,
}

describe('BranchRowActions', () => {
  it('opens the edit dialog prefilled with the branch', async () => {
    const u = userEvent.setup()
    renderWithProviders(<BranchRowActions branch={branch} />)

    expect(screen.queryByText('Edit cabang')).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Edit Cabang Demak' }))

    expect(await screen.findByText('Edit cabang')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cabang Demak')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Budi')).toBeInTheDocument()
  })
})
