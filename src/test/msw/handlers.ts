import { HttpResponse, http } from 'msw'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const oid = (prefix: string, n: number) => `${prefix}-1111-4111-8111-${String(n).padStart(12, '0')}`

const iso = (year: number, month: number, day: number) => new Date(year, month, day).toISOString()
const ymd = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// Auth + staff (real /v1/users shape) — kept so existing tests stay green.
// ---------------------------------------------------------------------------
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
const APP_USER_FIXTURES = Array.from({ length: 12 }, (_, i) => ({
  id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
  email: `user${i}@example.com`,
  fullName: `User ${String.fromCharCode(65 + (i % 26))}`,
  role: USER_ROLE_CYCLE[i % USER_ROLE_CYCLE.length] ?? 'customer',
  createdAt: iso(2026, 0, 1 + i),
}))

// ---------------------------------------------------------------------------
// ISP module fixtures
// ---------------------------------------------------------------------------
const PLAN_FIXTURES = [
  {
    id: oid('bbbbbbbb', 1),
    name: 'Home 20',
    speedMbps: 20,
    priceMonthly: 200_000,
    status: 'active',
  },
  {
    id: oid('bbbbbbbb', 2),
    name: 'Home 50',
    speedMbps: 50,
    priceMonthly: 350_000,
    status: 'active',
  },
  {
    id: oid('bbbbbbbb', 3),
    name: 'Pro 100',
    speedMbps: 100,
    priceMonthly: 600_000,
    status: 'active',
  },
  {
    id: oid('bbbbbbbb', 4),
    name: 'Legacy 10',
    speedMbps: 10,
    priceMonthly: 150_000,
    status: 'archived',
  },
] as const

const AREA_NAMES = ['Bandung Kota', 'Cimahi', 'Sumedang', 'Garut', 'Cianjur'] as const
const CUSTOMER_STATUS = ['active', 'active', 'pending', 'active', 'suspended', 'inactive'] as const

const CUSTOMER_FIXTURES = Array.from({ length: 14 }, (_, i) => {
  const plan = PLAN_FIXTURES[i % 3]
  return {
    id: oid('aaaaaaaa', i),
    customerNo: `CUST-${String(1001 + i)}`,
    fullName: `Customer ${String.fromCharCode(65 + (i % 26))}${i}`,
    phone: `0812${String(10000000 + i)}`,
    email: i % 3 === 0 ? null : `customer${i}@example.com`,
    address: `Jl. Merdeka No. ${i + 1}`,
    areaId: oid('dddddddd', i % AREA_NAMES.length),
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota',
    planId: plan?.id ?? oid('bbbbbbbb', 1),
    planName: plan?.name ?? 'Home 20',
    status: CUSTOMER_STATUS[i % CUSTOMER_STATUS.length] ?? 'active',
    joinedAt: iso(2025, i % 12, 1 + (i % 27)),
  }
})

const INVOICE_STATUS = ['paid', 'paid', 'pending', 'overdue', 'paid', 'draft'] as const
const INVOICE_FIXTURES = Array.from({ length: 12 }, (_, i) => {
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  const status = INVOICE_STATUS[i % INVOICE_STATUS.length] ?? 'pending'
  return {
    id: oid('cccccccc', i),
    invoiceNo: `INV-2026-${String(100 + i)}`,
    customerId: customer?.id ?? oid('aaaaaaaa', 0),
    customerName: customer?.fullName ?? 'Customer A0',
    periodStart: ymd(2026, 4, 1),
    periodEnd: ymd(2026, 4, 30),
    amount: 200_000 + (i % 4) * 150_000,
    status,
    dueDate: ymd(2026, 5, 10),
    paidAt: status === 'paid' ? iso(2026, 5, 3 + (i % 5)) : null,
  }
})

const DEVICE_TYPES = ['olt', 'onu', 'mikrotik'] as const
const DEVICE_STATUS = ['online', 'online', 'degraded', 'online', 'offline'] as const
const DEVICE_FIXTURES = Array.from({ length: 10 }, (_, i) => ({
  id: oid('eeeeeeee', i),
  name: `${(DEVICE_TYPES[i % 3] ?? 'onu').toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
  type: DEVICE_TYPES[i % 3] ?? 'onu',
  ipAddress: `10.10.${i}.1`,
  status: DEVICE_STATUS[i % DEVICE_STATUS.length] ?? 'online',
  uptimeHours: 120 + i * 37,
  areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota',
  lastSeenAt: iso(2026, 5, 5),
}))

const TICKET_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const
const TICKET_STATUS = ['open', 'in_progress', 'resolved', 'breached'] as const
const TICKET_FIXTURES = Array.from({ length: 8 }, (_, i) => {
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  return {
    id: oid('ffffffff', i),
    code: `TKT-${String(2001 + i)}`,
    subject: i % 2 === 0 ? 'No internet connection' : 'Slow speed at night',
    customerName: customer?.fullName ?? 'Customer A0',
    priority: TICKET_PRIORITY[i % TICKET_PRIORITY.length] ?? 'medium',
    status: TICKET_STATUS[i % TICKET_STATUS.length] ?? 'open',
    assignee: i % 3 === 0 ? null : 'Agent Sari',
    slaDueAt: iso(2026, 5, 6 + (i % 3)),
    createdAt: iso(2026, 5, 4),
  }
})

const COVERAGE_STATUS = ['operational', 'operational', 'maintenance', 'down'] as const
const COVERAGE_FIXTURES = AREA_NAMES.map((name, i) => ({
  id: oid('dddddddd', i),
  name: i % 2 === 0 ? `POP ${name}` : `Area ${name}`,
  type: i % 2 === 0 ? 'pop' : 'area',
  region: 'Jawa Barat',
  capacity: 500 + i * 100,
  activeConnections: 320 + i * 60,
  status: COVERAGE_STATUS[i % COVERAGE_STATUS.length] ?? 'operational',
}))

const REVENUE_TREND = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
  month,
  revenue: 42_000_000 + i * 3_500_000,
}))

const DASHBOARD_SUMMARY = {
  activeSubscribers: 1284,
  newThisMonth: 48,
  mrr: 61_500_000,
  overdueAmount: 7_350_000,
  overdueCount: 23,
  openTickets: 9,
  slaCompliance: 0.94,
  devicesOnline: 8,
  devicesTotal: 10,
  revenueTrend: REVENUE_TREND,
  ticketsByStatus: [
    { label: 'Terbuka', count: 9 },
    { label: 'Diproses', count: 5 },
    { label: 'Selesai', count: 31 },
  ],
}

const REPORTS_SUMMARY = {
  revenueTrend: REVENUE_TREND,
  movement: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
    month,
    added: 40 + i * 6,
    churned: 8 + (i % 3) * 3,
  })),
  arpu: 47_900,
  churnRate: 0.021,
}

const filterByStatus = <T extends { status: string }>(items: T[], status: string | null) =>
  status ? items.filter((item) => item.status === status) : items

// ---------------------------------------------------------------------------
// Handlers — base path is `*/api/*` (dev worker + node tests both use /api).
// ---------------------------------------------------------------------------
export const handlers = [
  // Auth
  http.post('*/api/auth/login', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/refresh', () => HttpResponse.json(SESSION_FIXTURE)),
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/auth/me', () => HttpResponse.json(USER_FIXTURE)),

  // Staff (cursor pagination, cursor?/limit?)
  http.get('*/api/users', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '50')))
    const startIndex = cursor ? APP_USER_FIXTURES.findIndex((u) => u.id === cursor) + 1 : 0
    const items = APP_USER_FIXTURES.slice(startIndex, startIndex + limit)
    const lastItem = items.at(-1)
    const hasMore = startIndex + limit < APP_USER_FIXTURES.length
    return HttpResponse.json({
      items,
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    })
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

  // Plans
  http.get('*/api/plans', () =>
    HttpResponse.json({ items: PLAN_FIXTURES, total: PLAN_FIXTURES.length }),
  ),
  http.post('*/api/plans', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      speedMbps: number
      priceMonthly: number
    }
    return HttpResponse.json(
      { id: oid('bbbbbbbb', 90), ...body, status: 'active' },
      { status: 201 },
    )
  }),

  // Customers
  http.get('*/api/customers', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const status = url.searchParams.get('status')
    let items = filterByStatus(CUSTOMER_FIXTURES, status)
    if (q) {
      items = items.filter(
        (c) => c.fullName.toLowerCase().includes(q) || c.customerNo.toLowerCase().includes(q),
      )
    }
    return HttpResponse.json({ items, total: items.length })
  }),
  http.get('*/api/customers/:id', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  http.post('*/api/customers', async ({ request }) => {
    const body = (await request.json()) as {
      fullName: string
      phone: string
      email: string
      address: string
      planId: string
    }
    const plan = PLAN_FIXTURES.find((p) => p.id === body.planId) ?? PLAN_FIXTURES[0]
    return HttpResponse.json(
      {
        id: oid('aaaaaaaa', 90),
        customerNo: 'CUST-9001',
        fullName: body.fullName,
        phone: body.phone,
        email: body.email === '' ? null : body.email,
        address: body.address,
        areaId: oid('dddddddd', 0),
        areaName: AREA_NAMES[0],
        planId: plan?.id ?? oid('bbbbbbbb', 1),
        planName: plan?.name ?? 'Home 20',
        status: 'pending',
        joinedAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),

  // Invoices
  http.get('*/api/invoices', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(INVOICE_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.get('*/api/invoices/:id', ({ params }) => {
    const found = INVOICE_FIXTURES.find((inv) => inv.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),

  // Devices
  http.get('*/api/devices', () =>
    HttpResponse.json({
      items: DEVICE_FIXTURES,
      total: DEVICE_FIXTURES.length,
    }),
  ),

  // Tickets
  http.get('*/api/tickets', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(TICKET_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/tickets', async ({ request }) => {
    const body = (await request.json()) as {
      subject: string
      customerName: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
    }
    return HttpResponse.json(
      {
        id: oid('ffffffff', 90),
        code: 'TKT-9001',
        subject: body.subject,
        customerName: body.customerName,
        priority: body.priority,
        status: 'open',
        assignee: null,
        slaDueAt: new Date(Date.now() + 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),

  // Coverage
  http.get('*/api/coverage', () =>
    HttpResponse.json({
      items: COVERAGE_FIXTURES,
      total: COVERAGE_FIXTURES.length,
    }),
  ),

  // Analytics
  http.get('*/api/analytics/dashboard', () => HttpResponse.json(DASHBOARD_SUMMARY)),
  http.get('*/api/analytics/reports', () => HttpResponse.json(REPORTS_SUMMARY)),
]
