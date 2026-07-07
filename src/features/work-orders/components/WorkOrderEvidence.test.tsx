import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WorkOrderSchema } from '@/schemas/workorder'

import { WorkOrderEvidence } from './WorkOrderEvidence'

const baseWo = WorkOrderSchema.parse({
  id: '00000000-0000-4000-8000-0000000000a1',
  code: 'WO-9001',
  type: 'install',
  customerId: '00000000-0000-4000-8000-0000000000c1',
  customerName: 'Budi Santoso',
  technician: 'Teknisi Budi',
  scheduledAt: '2026-06-16T00:00:00.000Z',
  status: 'done',
  ticketId: null,
  scannedOnuSerial: null,
  measuredRxPower: null,
  photos: null,
  signatureUrl: null,
  gpsLat: null,
  gpsLng: null,
  completedAt: null,
  completedBy: null,
  createdAt: '2026-06-15T00:00:00.000Z',
})

describe('WorkOrderEvidence', () => {
  it('renders the captured field evidence', () => {
    render(
      <WorkOrderEvidence
        wo={{
          ...baseWo,
          scannedOnuSerial: 'ZTEGABCD1234',
          measuredRxPower: -21.4,
          photos: ['https://cdn.example/p1.jpg', 'https://cdn.example/p2.jpg'],
          gpsLat: -6.59,
          gpsLng: 110.67,
          completionNotes: 'Redaman aman, pelanggan sudah tanda tangan.',
          completedBy: 'Teknisi Budi',
          completedAt: '2026-06-20T03:00:00.000Z',
        }}
      />,
    )
    expect(screen.getByText('ZTEGABCD1234')).toBeInTheDocument()
    // The technician's completion notes render read-only.
    expect(screen.getByText('Catatan penyelesaian')).toBeInTheDocument()
    expect(screen.getByText('Redaman aman, pelanggan sudah tanda tangan.')).toBeInTheDocument()
    expect(screen.getByText('-21.4 dBm')).toBeInTheDocument()
    expect(screen.getByText('Teknisi Budi')).toBeInTheDocument()
    // Two photo evidence links.
    expect(screen.getByRole('link', { name: 'Foto 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Foto 2' })).toBeInTheDocument()
    // GPS renders as a maps link.
    expect(screen.getByRole('link', { name: /-6\.59000, 110\.67000/ })).toHaveAttribute(
      'href',
      expect.stringContaining('maps?q=-6.59,110.67'),
    )
  })

  it('shows placeholders when no evidence was captured', () => {
    render(<WorkOrderEvidence wo={baseWo} />)
    expect(screen.getByText('Tidak ada foto.')).toBeInTheDocument()
    // Serial / RX / signature all fall back to the em dash.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    // No completion-notes section when the WO has none.
    expect(screen.queryByText('Catatan penyelesaian')).not.toBeInTheDocument()
  })
})
