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
]

const AREA_NAMES = ['Bandung Kota', 'Cimahi', 'Sumedang', 'Garut', 'Cianjur'] as const
const CUSTOMER_STATUS = [
  'aktif',
  'aktif',
  'isolir',
  'aktif',
  'instalasi',
  'prospek',
  'aktif',
  'berhenti',
] as const
const RESELLER_NAMES = ['Loket Andi', null, 'Agen Budi', null, 'Loket Citra'] as const

type ConnectionFixture = {
  type: 'pppoe' | 'gpon'
  pppoeUsername: string
  profile: string
  ipAddress: string
  onuSerial: string | null
  olt: string | null
  ponPort: string | null
  rxPower: number | null
}

const CUSTOMER_FIXTURES = Array.from({ length: 14 }, (_, i) => {
  const plan = PLAN_FIXTURES[i % 3]
  const status = CUSTOMER_STATUS[i % CUSTOMER_STATUS.length] ?? 'aktif'
  const provisioned = status === 'aktif' || status === 'isolir'
  const isGpon = i % 2 === 0
  const connection: ConnectionFixture | null = provisioned
    ? {
        type: isGpon ? 'gpon' : 'pppoe',
        pppoeUsername: `cust${1001 + i}`,
        profile: plan?.name ?? 'Home 20',
        ipAddress: `100.64.${i}.2`,
        onuSerial: isGpon ? `ZTEG${String(10000000 + i)}` : null,
        olt: isGpon ? `OLT-${(i % 2) + 1}` : null,
        ponPort: isGpon ? `0/${i % 8}/${i % 16}` : null,
        rxPower: isGpon ? -18 - (i % 9) : null, // -18 .. -26 dBm
      }
    : null
  return {
    id: oid('aaaaaaaa', i),
    customerNo: `CUST-${String(1001 + i)}`,
    fullName: `Pelanggan ${String.fromCharCode(65 + (i % 26))}${i}`,
    phone: `0812${String(10000000 + i)}`,
    email: i % 3 === 0 ? null : `pelanggan${i}@example.com`,
    address: `Jl. Merdeka No. ${i + 1}`,
    areaId: oid('dddddddd', i % AREA_NAMES.length),
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota',
    planId: plan?.id ?? oid('bbbbbbbb', 1),
    planName: plan?.name ?? 'Home 20',
    status,
    outstanding: status === 'isolir' ? 200_000 + (i % 3) * 150_000 : 0,
    resellerName: RESELLER_NAMES[i % RESELLER_NAMES.length] ?? null,
    connection,
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
    customerName: customer?.fullName ?? 'Pelanggan A0',
    periodStart: ymd(2026, 4, 1),
    periodEnd: ymd(2026, 4, 30),
    amount: 200_000 + (i % 4) * 150_000,
    lateFee: status === 'overdue' ? 25_000 : 0,
    status,
    dueDate: ymd(2026, 5, 10),
    paidAt: status === 'paid' ? iso(2026, 5, 3 + (i % 5)) : null,
  }
})

const PAYMENT_METHODS = ['qris', 'va', 'ewallet', 'transfer', 'cash'] as const
const PAYMENT_FIXTURES = INVOICE_FIXTURES.filter((inv) => inv.status === 'paid').map((inv, i) => ({
  id: oid('a9a9a9a9', i),
  invoiceNo: inv.invoiceNo,
  customerName: inv.customerName,
  amount: inv.amount + inv.lateFee,
  method: PAYMENT_METHODS[i % PAYMENT_METHODS.length] ?? 'qris',
  paidAt: inv.paidAt ?? iso(2026, 5, 5),
}))

const DEVICE_TYPES = ['olt', 'onu', 'mikrotik'] as const
const DEVICE_STATUS = ['online', 'online', 'degraded', 'online', 'offline'] as const
const DEVICE_FIXTURES = Array.from({ length: 10 }, (_, i) => {
  const type = DEVICE_TYPES[i % 3] ?? 'onu'
  return {
    id: oid('eeeeeeee', i),
    name: `${type.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    type,
    ipAddress: `10.10.${i}.1`,
    status: DEVICE_STATUS[i % DEVICE_STATUS.length] ?? 'online',
    uptimeHours: 120 + i * 37,
    rxPower: type === 'onu' ? -19 - (i % 8) : null, // -19 .. -26 dBm
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota',
    lastSeenAt: iso(2026, 5, 5),
  }
})

const ROUTER_STATUS = ['online', 'online', 'offline'] as const
const ROUTER_MODELS = ['RB5009', 'CCR2004', 'RB4011', 'hAP ax3'] as const
const ROUTER_FIXTURES = Array.from({ length: 6 }, (_, i) => ({
  id: oid('a7a7a7a7', i),
  name: `MIKROTIK-${AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota'}`,
  address: `10.20.${i}.1`,
  model: ROUTER_MODELS[i % ROUTER_MODELS.length] ?? 'RB5009',
  status: ROUTER_STATUS[i % ROUTER_STATUS.length] ?? 'online',
  secretCount: 80 + i * 35,
  lastSyncAt: iso(2026, 5, 5),
}))

const TICKET_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const
const TICKET_STATUS = ['open', 'in_progress', 'resolved', 'breached'] as const
const TICKET_FIXTURES = Array.from({ length: 8 }, (_, i) => {
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  return {
    id: oid('ffffffff', i),
    code: `TKT-${String(2001 + i)}`,
    subject: i % 2 === 0 ? 'Internet mati total' : 'Koneksi lambat saat malam',
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
  isolatedSubscribers: 37,
  mrr: 61_500_000,
  arOutstanding: 18_900_000,
  overdueAmount: 7_350_000,
  overdueCount: 23,
  openTickets: 9,
  slaCompliance: 0.94,
  devicesOnline: 142,
  devicesTotal: 150,
  revenueTrend: REVENUE_TREND,
  ticketsByStatus: [
    { label: 'Terbuka', count: 9 },
    { label: 'Diproses', count: 5 },
    { label: 'Selesai', count: 31 },
  ],
  subscriberTrend: [1180, 1205, 1221, 1248, 1262, 1284],
  isolatedTrend: [52, 48, 44, 41, 39, 37],
  arTrend: [12_400_000, 14_100_000, 13_500_000, 16_800_000, 17_900_000, 18_900_000],
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

const WORKORDER_TYPE = ['install', 'repair', 'dismantle'] as const
const WORKORDER_STATUS = ['scheduled', 'in_progress', 'done', 'cancelled'] as const
const TECHNICIANS = ['Teknisi Budi', 'Teknisi Sari', 'Teknisi Joko', null] as const
const WORKORDER_FIXTURES = Array.from({ length: 10 }, (_, i) => {
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  return {
    id: oid('a5a5a5a5', i),
    code: `WO-${String(3001 + i)}`,
    type: WORKORDER_TYPE[i % WORKORDER_TYPE.length] ?? 'install',
    customerName: customer?.fullName ?? 'Pelanggan A0',
    technician: TECHNICIANS[i % TECHNICIANS.length] ?? null,
    scheduledAt: iso(2026, 5, 6 + (i % 5)),
    status: WORKORDER_STATUS[i % WORKORDER_STATUS.length] ?? 'scheduled',
    createdAt: iso(2026, 5, 3),
  }
})

const RESELLER_STATUS = ['active', 'active', 'inactive'] as const
const RESELLER_FIXTURES = Array.from({ length: 6 }, (_, i) => ({
  id: oid('a3a3a3a3', i),
  name:
    i % 2 === 0
      ? `Loket ${AREA_NAMES[i % AREA_NAMES.length]}`
      : `Agen ${AREA_NAMES[i % AREA_NAMES.length]}`,
  area: AREA_NAMES[i % AREA_NAMES.length] ?? 'Bandung Kota',
  balance: 500_000 + i * 250_000,
  commissionPct: 0.05 + (i % 3) * 0.02,
  customerCount: 12 + i * 7,
  status: RESELLER_STATUS[i % RESELLER_STATUS.length] ?? 'active',
}))

const INVENTORY_KIND = ['onu', 'router', 'mikrotik'] as const
const INVENTORY_STATUS = ['warehouse', 'installed', 'installed', 'broken'] as const
const INVENTORY_FIXTURES = Array.from({ length: 16 }, (_, i) => {
  const status = INVENTORY_STATUS[i % INVENTORY_STATUS.length] ?? 'warehouse'
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  return {
    id: oid('a1a1a1a1', i),
    kind: INVENTORY_KIND[i % INVENTORY_KIND.length] ?? 'onu',
    serial: `SN-${String(500000 + i * 137)}`,
    status,
    assignedTo: status === 'installed' ? (customer?.fullName ?? 'Pelanggan A0') : null,
  }
})

const filterByStatus = <T extends { status: string }>(items: T[], status: string | null) =>
  status ? items.filter((item) => item.status === status) : items

// ---------------------------------------------------------------------------
// Stateful store — collections persist to localStorage so CRUD survives a
// refresh (dev). Tests reset to the seed before each test (see test/setup.ts).
// ---------------------------------------------------------------------------
const DB_KEY = 'isp-cms-mock-db-v1'

// All mutable collections, registered by name. Handlers read/write these
// arrays in place; resetMockDb()/persistDb() operate over the whole registry.
const COLLECTIONS: Record<string, unknown[]> = {
  users: APP_USER_FIXTURES,
  plans: PLAN_FIXTURES,
  customers: CUSTOMER_FIXTURES,
  invoices: INVOICE_FIXTURES,
  payments: PAYMENT_FIXTURES,
  devices: DEVICE_FIXTURES,
  routers: ROUTER_FIXTURES,
  workOrders: WORKORDER_FIXTURES,
  resellers: RESELLER_FIXTURES,
  inventory: INVENTORY_FIXTURES,
  coverage: COVERAGE_FIXTURES,
  tickets: TICKET_FIXTURES,
}
const COLLECTION_KEYS = Object.keys(COLLECTIONS)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const SEED = clone(COLLECTIONS)

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage

function persistDb() {
  if (!hasStorage()) return
  window.localStorage.setItem(DB_KEY, JSON.stringify(COLLECTIONS))
}

// Replace each array's contents in place so existing references stay valid.
function replaceAll(snapshot: Record<string, unknown[]>) {
  for (const key of COLLECTION_KEYS) {
    const target = COLLECTIONS[key]
    const next = snapshot[key]
    if (target && Array.isArray(next)) target.splice(0, target.length, ...next)
  }
}

function hydrateDb() {
  if (!hasStorage()) return
  const raw = window.localStorage.getItem(DB_KEY)
  if (!raw) return
  try {
    replaceAll(JSON.parse(raw))
  } catch {
    window.localStorage.removeItem(DB_KEY)
  }
}

export function resetMockDb() {
  replaceAll(clone(SEED))
  persistDb()
}

hydrateDb()

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
    const user = {
      id: crypto.randomUUID(),
      email: body.email,
      fullName: body.fullName,
      role: body.role ?? 'customer',
      createdAt: new Date().toISOString(),
    }
    APP_USER_FIXTURES.unshift(user)
    persistDb()
    return HttpResponse.json(user, { status: 201 })
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
    const plan = { id: crypto.randomUUID(), ...body, status: 'active' }
    PLAN_FIXTURES.unshift(plan)
    persistDb()
    return HttpResponse.json(plan, { status: 201 })
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
    const customer = {
      id: crypto.randomUUID(),
      customerNo: `CUST-${9000 + CUSTOMER_FIXTURES.length}`,
      fullName: body.fullName,
      phone: body.phone,
      email: body.email === '' ? null : body.email,
      address: body.address,
      areaId: oid('dddddddd', 0),
      areaName: AREA_NAMES[0] ?? 'Bandung Kota',
      planId: plan?.id ?? oid('bbbbbbbb', 1),
      planName: plan?.name ?? 'Home 20',
      status: 'prospek' as const,
      outstanding: 0,
      resellerName: null,
      connection: null,
      joinedAt: new Date().toISOString(),
    }
    CUSTOMER_FIXTURES.unshift(customer)
    persistDb()
    return HttpResponse.json(customer, { status: 201 })
  }),
  // Network enforcement (mock): flip lifecycle state for isolir/aktivasi.
  http.post('*/api/customers/:id/isolate', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'isolir'
    persistDb()
    return HttpResponse.json(found)
  }),
  http.post('*/api/customers/:id/activate', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'aktif'
    found.outstanding = 0
    persistDb()
    return HttpResponse.json(found)
  }),
  // GenieACS / TR-069 ONU actions (mock): no state change, just acknowledge.
  http.post('*/api/customers/:id/onu/reboot', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  http.post('*/api/customers/:id/onu/wifi', async ({ params, request }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    await request.json() // { ssid, password } — accepted, not persisted in mock
    return HttpResponse.json(found)
  }),
  http.post('*/api/customers/:id/notify/whatsapp', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
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
  // Record a payment: mark invoice paid + append a payment record.
  http.post('*/api/invoices/:id/pay', async ({ params, request }) => {
    const found = INVOICE_FIXTURES.find((inv) => inv.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      method: (typeof PAYMENT_METHODS)[number]
    }
    found.status = 'paid'
    found.paidAt = new Date().toISOString()
    PAYMENT_FIXTURES.unshift({
      id: crypto.randomUUID(),
      invoiceNo: found.invoiceNo,
      customerName: found.customerName,
      amount: found.amount + found.lateFee,
      method: body.method,
      paidAt: found.paidAt,
    })
    persistDb()
    return HttpResponse.json(found)
  }),

  // Payments
  http.get('*/api/payments', () =>
    HttpResponse.json({
      items: PAYMENT_FIXTURES,
      total: PAYMENT_FIXTURES.length,
    }),
  ),

  // Devices
  http.get('*/api/devices', () =>
    HttpResponse.json({
      items: DEVICE_FIXTURES,
      total: DEVICE_FIXTURES.length,
    }),
  ),
  http.get('*/api/devices/:id', ({ params }) => {
    const found = DEVICE_FIXTURES.find((d) => d.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  http.post('*/api/devices/:id/reboot', ({ params }) => {
    const found = DEVICE_FIXTURES.find((d) => d.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),

  // Routers (Mikrotik / RADIUS)
  http.get('*/api/routers', () =>
    HttpResponse.json({
      items: ROUTER_FIXTURES,
      total: ROUTER_FIXTURES.length,
    }),
  ),

  // Work orders
  http.get('*/api/work-orders', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(WORKORDER_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),

  // Resellers
  http.get('*/api/resellers', () =>
    HttpResponse.json({
      items: RESELLER_FIXTURES,
      total: RESELLER_FIXTURES.length,
    }),
  ),

  // Inventory
  http.get('*/api/inventory', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(INVENTORY_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),

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
    const ticket = {
      id: crypto.randomUUID(),
      code: `TKT-${9000 + TICKET_FIXTURES.length}`,
      subject: body.subject,
      customerName: body.customerName,
      priority: body.priority,
      status: 'open' as const,
      assignee: null,
      slaDueAt: new Date(Date.now() + 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    TICKET_FIXTURES.unshift(ticket)
    persistDb()
    return HttpResponse.json(ticket, { status: 201 })
  }),

  // Dev — reset the mock store back to seed.
  http.post('*/api/_dev/reset', () => {
    resetMockDb()
    return new HttpResponse(null, { status: 204 })
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
