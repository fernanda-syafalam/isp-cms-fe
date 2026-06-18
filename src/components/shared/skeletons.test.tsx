import { describe, expect, it } from 'vitest'

import { KpiCardSkeleton } from '@/components/shared/kpi-card'
import { renderWithProviders } from '@/test/helpers'

import { DetailCardSkeleton, FormSkeleton, PageHeaderSkeleton } from './skeletons'

// Skeletons are decorative, so query by the primitive's data-slot rather than
// by role/text — the assertion is "this many placeholder blocks rendered".
const countSkeletons = (container: HTMLElement) =>
  container.querySelectorAll('[data-slot="skeleton"]').length

describe('PageHeaderSkeleton', () => {
  it('renders a title and description block by default', () => {
    const { container } = renderWithProviders(<PageHeaderSkeleton />)
    expect(countSkeletons(container)).toBe(2)
  })

  it('adds an action block when requested', () => {
    const { container } = renderWithProviders(<PageHeaderSkeleton withAction />)
    expect(countSkeletons(container)).toBe(3)
  })
})

describe('DetailCardSkeleton', () => {
  it('renders a title plus a label/value pair per row', () => {
    const { container } = renderWithProviders(<DetailCardSkeleton rows={3} />)
    // 1 title + 3 rows × 2 = 7
    expect(countSkeletons(container)).toBe(7)
  })

  it('omits the title block when withTitle is false', () => {
    const { container } = renderWithProviders(<DetailCardSkeleton rows={2} withTitle={false} />)
    expect(countSkeletons(container)).toBe(4)
  })
})

describe('FormSkeleton', () => {
  it('renders a label/input pair per field plus a submit block', () => {
    const { container } = renderWithProviders(<FormSkeleton fields={2} />)
    // 2 fields × 2 + 1 submit = 5
    expect(countSkeletons(container)).toBe(5)
  })

  it('omits the submit block when withSubmit is false', () => {
    const { container } = renderWithProviders(<FormSkeleton fields={3} withSubmit={false} />)
    expect(countSkeletons(container)).toBe(6)
  })
})

describe('KpiCardSkeleton', () => {
  it('mirrors the KpiCard layout: label, icon, value, hint', () => {
    const { container } = renderWithProviders(<KpiCardSkeleton />)
    expect(countSkeletons(container)).toBe(4)
  })
})
