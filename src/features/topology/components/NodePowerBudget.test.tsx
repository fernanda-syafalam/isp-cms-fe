import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { LinkBudget } from '../lib/graph'
import { PowerBudget, resolveRxDiagnosis } from './NodePowerBudget'

const budget: LinkBudget = {
  lossDb: 22,
  budgetDb: 28,
  marginDb: 6,
  predictedRxDbm: -19,
}

describe('resolveRxDiagnosis', () => {
  it('returns null when there is no measured reading', () => {
    expect(resolveRxDiagnosis(-19, undefined)).toBeNull()
  })

  it('flags a reading well below prediction as a drop fault', () => {
    const d = resolveRxDiagnosis(-19, -24)
    expect(d?.delta).toBe(-5)
    expect(d?.hint).toMatch(/cek konektor\/sambungan drop/)
  })

  it('flags an overload reading (too hot)', () => {
    const d = resolveRxDiagnosis(-19, -5)
    expect(d?.hint).toMatch(/overload/)
  })

  it('gives no warning when the reading matches the estimate', () => {
    const d = resolveRxDiagnosis(-19, -20)
    expect(d?.hint).toBeNull()
  })
})

describe('PowerBudget', () => {
  it('shows predicted vs measured RX and a drop-fault hint', () => {
    render(<PowerBudget budget={budget} measuredRxDbm={-24} />)
    expect(screen.getByText(/RX prediksi/)).toBeInTheDocument()
    expect(screen.getByText(/-24 dBm/)).toBeInTheDocument()
    expect(screen.getByText(/cek konektor\/sambungan drop/)).toBeInTheDocument()
  })
})
