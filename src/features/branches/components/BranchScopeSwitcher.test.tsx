import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { useBranchScope } from '../store/branchScope'
import { BranchScopeSwitcher } from './BranchScopeSwitcher'

const EMPTY_BRANCHES = {
  items: [],
  total: 0,
  summary: {
    branches: 0,
    customers: 0,
    mrr: 0,
    byStatus: { active: 0, inactive: 0 },
  },
}

describe('BranchScopeSwitcher', () => {
  beforeEach(() => {
    // Global store persists across tests — reset to "all branches".
    useBranchScope.setState({ scope: null })
  })

  it('offers a retry when the branch list fails to load', async () => {
    const u = userEvent.setup()
    server.use(
      http.get('*/api/branches', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    renderWithProviders(<BranchScopeSwitcher />)
    await u.click(screen.getByRole('button', { name: 'Pilih cabang' }))

    expect(await screen.findByText('Gagal memuat cabang. Coba lagi.')).toBeInTheDocument()
  })

  it('shows an empty hint when there are no branches', async () => {
    const u = userEvent.setup()
    server.use(http.get('*/api/branches', () => HttpResponse.json(EMPTY_BRANCHES)))

    renderWithProviders(<BranchScopeSwitcher />)
    await u.click(screen.getByRole('button', { name: 'Pilih cabang' }))

    expect(await screen.findByText('Belum ada cabang')).toBeInTheDocument()
  })
})
