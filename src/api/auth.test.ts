import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/msw/server'

import { bootstrapAdmin, getBootstrapStatus, login, refreshSession } from './auth'

// Integration over the MSW layer — locks the first-run bootstrap contract
// (P3.E.1): the status probe and the create-admin call parse the backend shape.
describe('bootstrap api', () => {
  it('parses the bootstrap status (default: not required)', async () => {
    const status = await getBootstrapStatus()
    expect(status).toEqual({ required: false })
  })

  it('reads required:true when the backend reports a fresh install', async () => {
    server.use(http.get('*/api/auth/bootstrap', () => HttpResponse.json({ required: true })))
    const status = await getBootstrapStatus()
    expect(status.required).toBe(true)
  })

  it('returns a parsed session on create-admin', async () => {
    const session = await bootstrapAdmin({
      email: 'admin@example.com',
      fullName: 'Root Admin',
      password: 'super-secret-123',
    })
    expect(session.accessToken).toBeTruthy()
    expect(session.user.email).toBeTruthy()
  })
})

// Refresh must echo the identity the presented token carries (ADR-0011, #354),
// not the static admin fixture — otherwise a customer/2FA'd session that
// refreshes mid-flight silently reverts to the default admin.
describe('refresh identity', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null })
  })

  it("echoes customer A's identity when refreshing as A (not the default admin)", async () => {
    const sessionA = await login({ email: 'pelanggan1@example.com', password: 'portal-secret-123' })
    useAuthStore.setState({ accessToken: sessionA.accessToken, user: sessionA.user })

    const refreshed = await refreshSession()
    expect(refreshed.user.role).toBe('customer')
    expect(refreshed.user.email).toBe('pelanggan1@example.com')
    expect(refreshed.user.id).toBe(sessionA.user.id)
    // Regression guard: must NOT revert to the default admin fixture.
    expect(refreshed.user.email).not.toBe('admin@example.com')
  })

  it('returns the default admin session for the opaque admin/dev token', async () => {
    const admin = await login({ email: 'admin@example.com', password: 'secret-123' })
    useAuthStore.setState({ accessToken: admin.accessToken, user: admin.user })

    const refreshed = await refreshSession()
    expect(refreshed.user.role).toBe('admin')
    expect(refreshed.user.email).toBe('admin@example.com')
  })
})
