import { HttpResponse, http } from 'msw'

const TENANT_FIXTURE = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Acme Clinic',
  email: 'admin@acme.test',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const USER_FIXTURE = {
  id: '99999999-9999-4999-8999-999999999999',
  email: 'admin@example.com',
  name: 'Test Admin',
}

const SESSION_FIXTURE = {
  accessToken: 'test-access-token',
  user: USER_FIXTURE,
}

export const handlers = [
  // Auth
  http.post('*/api/auth/login', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/refresh', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/me', () => HttpResponse.json(USER_FIXTURE)),

  // Tenants
  http.get('*/api/tenants', () => HttpResponse.json({ items: [TENANT_FIXTURE], total: 1 })),

  http.get('*/api/tenants/:id', ({ params }) =>
    HttpResponse.json({ ...TENANT_FIXTURE, id: params['id'] }),
  ),

  http.post('*/api/tenants', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string }
    return HttpResponse.json({
      ...TENANT_FIXTURE,
      id: '22222222-2222-4222-8222-222222222222',
      name: body.name,
      email: body.email,
      status: 'pending',
    })
  }),

  http.post('*/api/tenants/:id/suspend', ({ params }) =>
    HttpResponse.json({ ...TENANT_FIXTURE, id: params['id'], status: 'suspended' }),
  ),
]
