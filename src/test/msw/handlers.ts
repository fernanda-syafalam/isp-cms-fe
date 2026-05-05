import { HttpResponse, http } from 'msw'

export const handlers = [
  http.get('*/api/tenants', () => {
    return HttpResponse.json({
      items: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Acme Clinic',
          email: 'admin@acme.test',
          status: 'active',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    })
  }),
]
