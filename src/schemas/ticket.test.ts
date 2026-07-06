import { describe, expect, it } from 'vitest'

import { PortalTicketDetailSchema, SubmitCsatSchema, TicketSchema } from './ticket'

const TICKET_ID = '00000000-0000-4000-8000-000000000001'

const baseTicket = {
  id: TICKET_ID,
  code: 'TKT-2001',
  subject: 'Internet mati total',
  customerId: null,
  customerName: 'Budi Santoso',
  priority: 'medium' as const,
  status: 'resolved' as const,
  assignee: null,
  slaDueAt: '2026-07-06T00:00:00.000Z',
  createdAt: '2026-07-04T00:00:00.000Z',
}

describe('TicketSchema (P3.C.2 fields)', () => {
  it('parses a ticket carrying category, photo, and CSAT fields', () => {
    const parsed = TicketSchema.parse({
      ...baseTicket,
      category: 'koneksi_putus',
      photoUrl: 'https://example.com/foto.jpg',
      csatRating: 5,
      csatComment: 'Cepat ditangani',
      csatAt: '2026-07-06T01:00:00.000Z',
    })
    expect(parsed.category).toBe('koneksi_putus')
    expect(parsed.csatRating).toBe(5)
  })

  it('still parses a legacy ticket without the new fields', () => {
    const parsed = TicketSchema.parse(baseTicket)
    expect(parsed.category).toBeUndefined()
    expect(parsed.csatAt).toBeUndefined()
  })

  it('rejects a CSAT rating outside 1..5', () => {
    const result = TicketSchema.safeParse({ ...baseTicket, csatRating: 6 })
    expect(result.success).toBe(false)
  })
})

describe('SubmitCsatSchema', () => {
  it('accepts a rating with an optional comment', () => {
    expect(SubmitCsatSchema.parse({ rating: 4, comment: 'Baik' }).rating).toBe(4)
    expect(SubmitCsatSchema.parse({ rating: 3 }).comment).toBeUndefined()
  })

  it('rejects a rating below 1', () => {
    expect(SubmitCsatSchema.safeParse({ rating: 0 }).success).toBe(false)
  })
})

describe('PortalTicketDetailSchema', () => {
  it('parses a ticket with its timeline, including a csat event', () => {
    const parsed = PortalTicketDetailSchema.parse({
      ...baseTicket,
      csatAt: '2026-07-06T01:00:00.000Z',
      csatRating: 5,
      events: [
        {
          id: 'ev-1',
          ticketId: TICKET_ID,
          kind: 'created',
          author: 'Budi Santoso',
          body: 'Internet mati total',
          at: '2026-07-04T00:00:00.000Z',
        },
        {
          id: 'ev-2',
          ticketId: TICKET_ID,
          kind: 'csat',
          author: 'Budi Santoso',
          body: 'Penilaian 5/5',
          at: '2026-07-06T01:00:00.000Z',
        },
      ],
    })
    expect(parsed.events).toHaveLength(2)
    expect(parsed.events[1]?.kind).toBe('csat')
  })
})
