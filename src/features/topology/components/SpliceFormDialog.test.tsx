import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { SpliceFormDialog } from './SpliceFormDialog'

describe('SpliceFormDialog', () => {
  it('offers a retry when the cable list fails to load', async () => {
    server.use(
      http.get('*/api/cables', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    renderWithProviders(<SpliceFormDialog closureId="c1" nodeId="n1" open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Gagal memuat kabel')).toBeInTheDocument()
  })

  it('prompts to add a cable first when there are none', async () => {
    server.use(http.get('*/api/cables', () => HttpResponse.json({ items: [], total: 0 })))

    renderWithProviders(<SpliceFormDialog closureId="c1" nodeId="n1" open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Belum ada kabel')).toBeInTheDocument()
  })
})
