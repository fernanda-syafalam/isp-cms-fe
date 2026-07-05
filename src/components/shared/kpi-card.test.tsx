import { screen } from '@testing-library/react'
import { ActivityIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { KpiCard } from '@/components/shared/kpi-card'
import { renderWithProviders } from '@/test/helpers'

const SKELETON = '[data-slot="skeleton"]'

describe('KpiCard', () => {
  it('renders the label and a formatted numeric value', () => {
    renderWithProviders(<KpiCard label="Total cabang" value={42} icon={ActivityIcon} />)

    expect(screen.getByText('Total cabang')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a string value verbatim (no count-up)', () => {
    renderWithProviders(<KpiCard label="Status" value="Aktif" icon={ActivityIcon} />)

    expect(screen.getByText('Aktif')).toBeInTheDocument()
  })

  it('renders the optional hint', () => {
    renderWithProviders(
      <KpiCard label="Terisolir" value={3} hint="pelanggan diisolir" icon={ActivityIcon} />,
    )

    expect(screen.getByText('pelanggan diisolir')).toBeInTheDocument()
  })

  it('shows a skeleton while loading instead of a fake value', () => {
    const { container } = renderWithProviders(
      <KpiCard label="Total cabang" value={42} icon={ActivityIcon} isLoading />,
    )

    // Loading owns the whole card so the grid never flashes a placeholder 0
    // before data lands; the skeleton mirrors the four KpiCard blocks.
    expect(container.querySelectorAll(SKELETON)).toHaveLength(4)
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('shows a friendly error state instead of a stale/zero value on error', () => {
    renderWithProviders(<KpiCard label="Total cabang" value={42} icon={ActivityIcon} isError />)

    expect(screen.getByText('Gagal memuat')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('prefers the loading state when both loading and error are set', () => {
    const { container } = renderWithProviders(
      <KpiCard label="Total cabang" value={42} icon={ActivityIcon} isLoading isError />,
    )

    expect(container.querySelectorAll(SKELETON)).toHaveLength(4)
    expect(screen.queryByText('Gagal memuat')).not.toBeInTheDocument()
  })

  it('marks the decorative metric icon as hidden from assistive tech', () => {
    const { container } = renderWithProviders(
      <KpiCard label="Total cabang" value={42} icon={ActivityIcon} />,
    )

    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows the "Estimasi" marker only when estimated is set', () => {
    const { rerender } = renderWithProviders(
      <KpiCard label="MRR" value={42} icon={ActivityIcon} estimated />,
    )
    expect(screen.getByText('Estimasi')).toBeInTheDocument()

    rerender(<KpiCard label="MRR" value={42} icon={ActivityIcon} />)
    expect(screen.queryByText('Estimasi')).not.toBeInTheDocument()
  })

  it('carries the estimate caveat as an accessible label', () => {
    renderWithProviders(<KpiCard label="MRR" value={42} icon={ActivityIcon} estimated />)

    expect(screen.getByText('Estimasi')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('estimasi'),
    )
  })

  it('never shows the estimate marker in the loading or error states', () => {
    const { rerender } = renderWithProviders(
      <KpiCard label="MRR" value={42} icon={ActivityIcon} estimated isLoading />,
    )
    expect(screen.queryByText('Estimasi')).not.toBeInTheDocument()

    rerender(<KpiCard label="MRR" value={42} icon={ActivityIcon} estimated isError />)
    expect(screen.queryByText('Estimasi')).not.toBeInTheDocument()
  })

  it('does not wrap a non-drill-down card in a link', () => {
    const { container } = renderWithProviders(
      <KpiCard label="Total cabang" value={42} icon={ActivityIcon} />,
    )

    // Drill-down link variants are guarded at compile time by the typed
    // KpiDrill union; here we assert the default card stays plain (no anchor).
    expect(container.querySelector('a')).toBeNull()
  })
})
