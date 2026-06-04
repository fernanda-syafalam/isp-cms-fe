import { HttpResponse, http } from 'msw'

const STATUS_CYCLE = ['active', 'pending', 'suspended', 'active'] as const

const TENANT_FIXTURES = Array.from({ length: 23 }, (_, i) => ({
  id: `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`,
  name: `Clinic ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
  email: `admin${i}@clinic.test`,
  status: STATUS_CYCLE[i % STATUS_CYCLE.length] ?? 'active',
  createdAt: new Date(2026, 0, 1 + i).toISOString(),
}))

const USER_FIXTURE = {
  id: '99999999-9999-4999-8999-999999999999',
  email: 'admin@example.com',
  fullName: 'Test Admin',
  role: 'admin' as const,
}

const SESSION_FIXTURE = {
  accessToken: 'test-access-token',
  user: USER_FIXTURE,
}

const USER_ROLE_CYCLE = ['admin', 'staff', 'customer'] as const

// App-user fixtures for the /users feature (cursor pagination).
const APP_USER_FIXTURES = Array.from({ length: 12 }, (_, i) => ({
  id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
  email: `user${i}@example.com`,
  fullName: `User ${String.fromCharCode(65 + (i % 26))}`,
  role: USER_ROLE_CYCLE[i % USER_ROLE_CYCLE.length] ?? 'customer',
  createdAt: new Date(2026, 0, 1 + i).toISOString(),
}))

export const handlers = [
  // Auth
  http.post('*/api/auth/login', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/refresh', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/auth/me', () => HttpResponse.json(USER_FIXTURE)),

  // Users — cursor pagination (cursor?, limit? 1..100 default 50).
  http.get('*/api/users', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '50')))

    const startIndex = cursor ? APP_USER_FIXTURES.findIndex((u) => u.id === cursor) + 1 : 0
    const items = APP_USER_FIXTURES.slice(startIndex, startIndex + limit)
    const lastItem = items.at(-1)
    const hasMore = startIndex + limit < APP_USER_FIXTURES.length
    const nextCursor = hasMore && lastItem ? lastItem.id : null

    return HttpResponse.json({ items, nextCursor })
  }),

  http.post('*/api/users', async ({ request }) => {
    const body = (await request.json()) as {
      email: string
      fullName: string
      role?: 'admin' | 'staff' | 'customer'
    }
    return HttpResponse.json(
      {
        id: '44444444-4444-4444-8444-444444444444',
        email: body.email,
        fullName: body.fullName,
        role: body.role ?? 'customer',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),

  // Tenants — supports q, status, page, pageSize, sortBy, sortDir.
  http.get('*/api/tenants', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20')
    const sortBy = url.searchParams.get('sortBy') as
      | 'name'
      | 'email'
      | 'status'
      | 'createdAt'
      | null
    const sortDir = url.searchParams.get('sortDir') === 'desc' ? -1 : 1

    let filtered = TENANT_FIXTURES.filter((t) => {
      if (status && t.status !== status) return false
      if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q)) {
        return false
      }
      return true
    })

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const av = a[sortBy]
        const bv = b[sortBy]
        if (av < bv) return -1 * sortDir
        if (av > bv) return 1 * sortDir
        return 0
      })
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    return HttpResponse.json({ items, total })
  }),

  http.get('*/api/tenants/:id', ({ params }) => {
    const found = TENANT_FIXTURES.find((t) => t.id === params.id)
    return HttpResponse.json(found ?? { ...TENANT_FIXTURES[0], id: params.id })
  }),

  http.post('*/api/tenants', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string }
    return HttpResponse.json({
      id: '22222222-2222-4222-8222-222222222222',
      name: body.name,
      email: body.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  }),

  http.post('*/api/tenants/:id/suspend', ({ params }) => {
    const found = TENANT_FIXTURES.find((t) => t.id === params.id) ?? TENANT_FIXTURES[0]
    return HttpResponse.json({ ...found, id: params.id, status: 'suspended' })
  }),
]
