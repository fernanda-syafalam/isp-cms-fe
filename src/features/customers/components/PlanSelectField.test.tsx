import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { Form } from '@/components/ui/form'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { PlanSelectField } from './PlanSelectField'

// Minimal RHF host so the field has a control + form context (FormMessage etc.).
function Harness() {
  const form = useForm<{ planId: string }>({ defaultValues: { planId: '' } })
  return (
    <Form {...form}>
      <PlanSelectField control={form.control} name="planId" />
    </Form>
  )
}

const EMPTY_PLANS = {
  items: [],
  total: 0,
  summary: {
    total: 0,
    totalSubscribers: 0,
    byStatus: { active: 0, archived: 0 },
  },
}

describe('PlanSelectField', () => {
  it('enables the picker once plans load', async () => {
    renderWithProviders(<Harness />)

    await waitFor(() => expect(screen.getByRole('combobox')).toBeEnabled())
    expect(screen.queryByText('Gagal memuat paket. Coba lagi.')).not.toBeInTheDocument()
    expect(screen.queryByText('Belum ada paket aktif.')).not.toBeInTheDocument()
  })

  it('offers a retry, and disables the select, when plans fail to load', async () => {
    server.use(
      http.get('*/api/plans', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    renderWithProviders(<Harness />)

    expect(await screen.findByText('Gagal memuat paket. Coba lagi.')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('hints to create a plan when there are no active plans', async () => {
    server.use(http.get('*/api/plans', () => HttpResponse.json(EMPTY_PLANS)))

    renderWithProviders(<Harness />)

    expect(await screen.findByText('Belum ada paket aktif.')).toBeInTheDocument()
  })
})
