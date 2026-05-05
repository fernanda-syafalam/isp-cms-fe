import { HttpResponse, http } from 'msw'

const TENANT_FIXTURE = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Acme Clinic',
  email: 'admin@acme.test',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
}

export const handlers = [
  http.get('*/api/tenants', () => HttpResponse.json({ items: [TENANT_FIXTURE], total: 1 })),

  http.get('*/api/tenants/:id', ({ params }) =>
    HttpResponse.json({ ...TENANT_FIXTURE, id: params['id'] }),
  ),

  http.post('*/api/tenants', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string }
    return HttpResponse.json({
      ...TENANT_FIXTURE,
      id: '22222222-2222-2222-2222-222222222222',
      name: body.name,
      email: body.email,
      status: 'pending',
    })
  }),

  http.post('*/api/tenants/:id/suspend', ({ params }) =>
    HttpResponse.json({ ...TENANT_FIXTURE, id: params['id'], status: 'suspended' }),
  ),
]
