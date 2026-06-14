import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { SplitterPort } from '@/schemas/splitter'

import { InstallAllocation } from './InstallAllocation'

function port(portNo: number): SplitterPort {
  return { portNo, outNodeId: null, customerId: null, strandId: null }
}

describe('InstallAllocation', () => {
  it('previews the chosen port + TIA-598 core color', () => {
    const chosen = port(5)
    render(
      <InstallAllocation
        ports={[port(1), chosen]}
        selectedPort={chosen}
        onPortChange={vi.fn()}
        loading={false}
        dropMeters={80}
        hasOdp
      />,
    )
    // core #5 is "Abu-abu" (TIA-598); preview names the picked port + core
    expect(screen.getByText(/Port #5 Abu-abu/)).toBeInTheDocument()
    // a short drop draws no warning
    expect(screen.queryByText(/cukup panjang/)).not.toBeInTheDocument()
  })

  it('warns (non-blocking) when the drop is long', () => {
    const chosen = port(2)
    render(
      <InstallAllocation
        ports={[chosen]}
        selectedPort={chosen}
        onPortChange={vi.fn()}
        loading={false}
        dropMeters={400}
        hasOdp
      />,
    )
    expect(screen.getByText(/cukup panjang/)).toBeInTheDocument()
  })

  it('shows an empty-port message when the ODP is full', () => {
    render(
      <InstallAllocation
        ports={[]}
        selectedPort={null}
        onPortChange={vi.fn()}
        loading={false}
        dropMeters={0}
        hasOdp
      />,
    )
    expect(screen.getByText('ODP ini tidak punya port tersisa.')).toBeInTheDocument()
  })
})
