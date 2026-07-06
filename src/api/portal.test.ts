import { describe, expect, it } from 'vitest'

import { updateTicket } from './tickets'
import { addPortalComment, getPortalMe, getPortalTicket, reportIssue, submitCsat } from './portal'

// Integration over the MSW portal handlers (server from test/setup.ts;
// resetMockDb runs before each test). The portal customer resolves to a
// representative active subscriber, so its seeded tickets are owner-scoped.

describe('reportIssue', () => {
  it('creates a ticket carrying the selected category', async () => {
    await reportIssue({
      subject: 'Internet putus sejak pagi',
      category: 'lambat',
    })
    const me = await getPortalMe()
    const created = me.tickets.find((t) => t.subject === 'Internet putus sejak pagi')
    expect(created).toBeDefined()
    expect(created?.category).toBe('lambat')
  })
})

describe('getPortalTicket + addPortalComment', () => {
  it('returns the ticket timeline and appends a customer comment', async () => {
    const me = await getPortalMe()
    const owned = me.tickets[0]
    if (!owned) throw new Error('portal customer has no seeded ticket')

    const detail = await getPortalTicket(owned.id)
    expect(detail.id).toBe(owned.id)
    expect(detail.events.length).toBeGreaterThan(0)

    await addPortalComment(owned.id, { body: 'Halo tim, mohon dibantu' })
    const after = await getPortalTicket(owned.id)
    const comment = after.events.find(
      (e) => e.kind === 'comment' && e.body === 'Halo tim, mohon dibantu',
    )
    expect(comment).toBeDefined()
  })

  it('404s for a ticket the portal customer does not own', async () => {
    await expect(getPortalTicket('00000000-0000-4000-8000-000000000099')).rejects.toThrow()
  })
})

describe('submitCsat', () => {
  it('records the rating on a resolved/breached ticket', async () => {
    const me = await getPortalMe()
    const owned = me.tickets[0]
    if (!owned) throw new Error('portal customer has no seeded ticket')

    // Move the ticket into a terminal state so CSAT is allowed.
    await updateTicket(owned.id, { status: 'resolved' })

    const rated = await submitCsat(owned.id, {
      rating: 5,
      comment: 'Cepat ditangani',
    })
    expect(rated.csatRating).toBe(5)
    expect(rated.csatAt).not.toBeNull()

    const detail = await getPortalTicket(owned.id)
    expect(detail.events.some((e) => e.kind === 'csat')).toBe(true)
  })
})
