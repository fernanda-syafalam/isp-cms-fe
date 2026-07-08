import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store/authStore'

import { login } from './auth'
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

// Per-user identity resolution (ADR-0011 parity): GET /portal/me must reflect
// the AUTHENTICATED subscriber, not a fixed account. The mock login carries the
// identity inside the access token; here we log in as two different customers
// and assert their portal snapshots differ. Fail-closed mirrors the BE
// resolveForPortal (404 when the token maps to no customer).
describe('portal identity resolves per authenticated customer', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null })
  })

  async function loginAsCustomer(email: string) {
    const session = await login({ email, password: 'portal-secret-123' })
    useAuthStore.setState({
      accessToken: session.accessToken,
      user: session.user,
    })
    return session
  }

  it("returns customer A for A's login and customer B for B's login", async () => {
    // pelanggan1 is an active subscriber; pelanggan2 is isolir — distinct people
    // AND distinct states, so the difference is unmistakable.
    const sessionA = await loginAsCustomer('pelanggan1@example.com')
    expect(sessionA.user.role).toBe('customer')
    const meA = await getPortalMe()
    expect(meA.customer.email).toBe('pelanggan1@example.com')
    expect(meA.customer.status).toBe('aktif')

    await loginAsCustomer('pelanggan2@example.com')
    const meB = await getPortalMe()
    expect(meB.customer.email).toBe('pelanggan2@example.com')
    expect(meB.customer.status).toBe('isolir')

    // The whole point: two logins, two identities.
    expect(meB.customer.id).not.toBe(meA.customer.id)
  })

  it('fails closed (rejects) when the token maps to no customer', async () => {
    // A token carrying an identity that matches no subscriber must 404 rather
    // than fall back to someone else's account (mirrors resolveForPortal).
    useAuthStore.setState({
      accessToken: 'test-access-token~ghost@example.com',
    })
    await expect(getPortalMe()).rejects.toThrow()
  })
})

// Dev role switcher (UserMenu → roleStore) demo ergonomics: switching to the
// customer role does NOT log in a subscriber, so the token stays the default
// admin/dev token. Without help the portal would render the anonymous default
// subscriber (which has no email/ticket context). The mock reads the persisted
// dev-role override and resolves a concrete seeded subscriber (pelanggan1) so a
// demo shows real data. Mock/dev-only — no effect on the real token contract.
describe('portal resolves a seeded customer for the DEV role switcher', () => {
  const DEV_ROLE_KEY = 'isp-cms-dev-role'

  afterEach(() => {
    window.localStorage.removeItem(DEV_ROLE_KEY)
  })

  it('resolves pelanggan1 (real data) instead of the anonymous default', async () => {
    // No override → the anonymous default subscriber (first active, no email).
    const anonymous = await getPortalMe()
    expect(anonymous.customer.email).toBeNull()

    // Demo-er switches to the customer role → a concrete seeded subscriber.
    window.localStorage.setItem(DEV_ROLE_KEY, 'customer')
    const demo = await getPortalMe()
    expect(demo.customer.email).toBe('pelanggan1@example.com')
    expect(demo.customer.status).toBe('aktif')
    expect(demo.customer.id).not.toBe(anonymous.customer.id)
  })
})
