import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { InstallPlacementHint } from './InstallPlacementHint'

describe('InstallPlacementHint', () => {
  it('tells the technician to click the customer location on the map', () => {
    renderWithProviders(
      <InstallPlacementHint canUseGps={false} onUseGps={vi.fn()} onCancel={vi.fn()} />,
    )

    expect(
      screen.getByText('Klik lokasi rumah pelanggan di peta untuk memasang.'),
    ).toBeInTheDocument()
  })

  it('hides the GPS shortcut when no position is known', () => {
    renderWithProviders(
      <InstallPlacementHint canUseGps={false} onUseGps={vi.fn()} onCancel={vi.fn()} />,
    )

    expect(screen.queryByRole('button', { name: 'Gunakan lokasi saya' })).not.toBeInTheDocument()
  })

  it('offers the GPS shortcut and reports the request when a position is known', async () => {
    const onUseGps = vi.fn()
    renderWithProviders(<InstallPlacementHint canUseGps onUseGps={onUseGps} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Gunakan lokasi saya' }))

    expect(onUseGps).toHaveBeenCalledTimes(1)
  })

  it('cancels placement mode via Batal', async () => {
    const onCancel = vi.fn()
    renderWithProviders(
      <InstallPlacementHint canUseGps={false} onUseGps={vi.fn()} onCancel={onCancel} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
