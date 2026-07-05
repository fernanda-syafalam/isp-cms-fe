import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/msw/server'

import { bootstrapAdmin, getBootstrapStatus } from './auth'

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
