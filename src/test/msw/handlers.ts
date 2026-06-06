import { HttpResponse, http } from 'msw'

import { SLA_HOURS } from '@/lib/sla'
import type { PppProfile, PppSecret, PppSession, SimpleQueue } from '@/schemas/mikrotik'
import type { TicketEvent } from '@/schemas/ticket'

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

const AREA_NAMES: string[] = ['Bandung Kota', 'Cimahi', 'Sumedang', 'Garut', 'Cianjur']
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
    // Every 4th subscriber is a PKP/business account with an NPWP.
    npwp:
      i % 4 === 0
        ? `0${String(10000000 + i * 7).slice(0, 8)}.${String(100 + i).slice(0, 3)}.000`
        : null,
    resellerName: RESELLER_NAMES[i % RESELLER_NAMES.length] ?? null,
    connection,
    joinedAt: iso(2025, i % 12, 1 + (i % 27)),
  }
})

const INVOICE_STATUS = ['paid', 'paid', 'pending', 'overdue', 'paid', 'draft'] as const
// PPN efektif 11% (mekanisme DPP 11/12). Nomor faktur pajak format 16-digit.
const PPN_RATE = 0.11
const ppnOf = (dpp: number) => Math.round(dpp * PPN_RATE)
const fakturNo = (seq: number) => `010.000-26.${String(10_000_000 + seq).padStart(8, '0')}`

const INVOICE_FIXTURES = Array.from({ length: 12 }, (_, i) => {
  const customer = CUSTOMER_FIXTURES[i % CUSTOMER_FIXTURES.length]
  const status = INVOICE_STATUS[i % INVOICE_STATUS.length] ?? 'pending'
  const amount = 200_000 + (i % 4) * 150_000
  return {
    id: oid('cccccccc', i),
    invoiceNo: `INV-2026-${String(100 + i)}`,
    customerId: customer?.id ?? oid('aaaaaaaa', 0),
    customerName: customer?.fullName ?? 'Pelanggan A0',
    periodStart: ymd(2026, 4, 1),
    periodEnd: ymd(2026, 4, 30),
    amount,
    lateFee: status === 'overdue' ? 25_000 : 0,
    taxAmount: ppnOf(amount),
    // Draft invoices have no tax invoice number yet (type stays string | null).
    taxInvoiceNo: status === 'draft' ? null : fakturNo(i),
    status,
    dueDate: ymd(2026, 5, 10),
    paidAt: status === 'paid' ? iso(2026, 5, 3 + (i % 5)) : null,
    // Overdue invoices already had a first reminder; others none yet.
    lastRemindedAt: status === 'overdue' ? iso(2026, 5, 12) : null,
  }
})

const PAYMENT_METHODS = ['qris', 'va', 'ewallet', 'transfer', 'cash'] as const
const PAYMENT_FIXTURES = INVOICE_FIXTURES.filter((inv) => inv.status === 'paid').map((inv, i) => ({
  id: oid('a9a9a9a9', i),
  invoiceNo: inv.invoiceNo,
  customerName: inv.customerName,
  amount: inv.amount + inv.lateFee + inv.taxAmount,
  method: PAYMENT_METHODS[i % PAYMENT_METHODS.length] ?? 'qris',
  paidAt: inv.paidAt ?? iso(2026, 5, 5),
}))

// Online payment-gateway charges (QRIS/VA/e-wallet). Created at checkout, marked
// paid by a simulated webhook. Starts empty; loose-typed so the array can grow.
type PaymentIntentRecord = {
  id: string
  invoiceId: string
  invoiceNo: string
  customerName: string
  amount: number
  channel: string
  status: 'pending' | 'paid' | 'expired'
  vaNumber: string | null
  qrPayload: string | null
  createdAt: string
  expiresAt: string
  paidAt: string | null
}
const PAYMENT_INTENT_FIXTURES: PaymentIntentRecord[] = []

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
const TECHNICIANS: (string | null)[] = ['Teknisi Budi', 'Teknisi Sari', 'Teknisi Joko', null]
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

// Deposit/commission ledger per reseller. Built cumulatively so balanceAfter is
// always consistent; each reseller's balance is then synced to its final entry.
const RESELLER_LEDGER_SEED: Array<{
  type: string
  amount: number
  note: string
}> = [
  { type: 'topup', amount: 1_000_000, note: 'Setoran awal deposit' },
  { type: 'commission', amount: 175_000, note: 'Komisi bulan lalu' },
  { type: 'deduction', amount: -200_000, note: 'Aktivasi pelanggan baru' },
  { type: 'commission', amount: 120_000, note: 'Komisi berjalan' },
]
const RESELLER_LEDGER_FIXTURES = RESELLER_FIXTURES.flatMap((r, ri) => {
  let bal = 0
  return RESELLER_LEDGER_SEED.map((e, j) => {
    const amount = e.amount + (e.amount > 0 ? ri * 10_000 : -ri * 5_000)
    bal += amount
    return {
      id: `${r.id}-led-${j}`,
      resellerId: r.id,
      type: e.type,
      amount,
      note: e.note,
      balanceAfter: bal,
      at: iso(2026, 2 + Math.floor(j / 2), 5 + j * 6),
    }
  })
})
// Sync each reseller's stored balance to its ledger's final balanceAfter.
for (const r of RESELLER_FIXTURES) {
  const entries = RESELLER_LEDGER_FIXTURES.filter((e) => e.resellerId === r.id)
  const last = entries.at(-1)
  if (last) r.balance = last.balanceAfter
}

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

// Stock movement trail seeded from the current item states: every item has an
// "in" (warehouse) entry; installed items add an "assign", broken add a "broken".
const STOCK_MOVEMENT_FIXTURES = INVENTORY_FIXTURES.flatMap((item, i) => {
  const moves: Array<{
    type: 'in' | 'assign' | 'return' | 'broken'
    note: string
    at: string
  }> = [{ type: 'in', note: 'Stok masuk awal', at: iso(2026, 2, 1 + (i % 20)) }]
  if (item.status === 'installed') {
    moves.push({
      type: 'assign',
      note: item.assignedTo ?? 'Pelanggan',
      at: iso(2026, 3, 2 + (i % 20)),
    })
  }
  if (item.status === 'broken') {
    moves.push({
      type: 'broken',
      note: 'Rusak saat pengecekan',
      at: iso(2026, 3, 3 + (i % 20)),
    })
  }
  return moves.map((m, j) => ({
    id: `${item.id}-mv-${j}`,
    itemId: item.id,
    serial: item.serial,
    kind: item.kind,
    type: m.type,
    note: m.note,
    at: m.at,
  }))
})

const filterByStatus = <T extends { status: string }>(items: T[], status: string | null) =>
  status ? items.filter((item) => item.status === status) : items

// Network topology: OLT → ODC → ODP → Tiang → Pelanggan, around Bandung.
// Read-only mock dataset (ADR-0004); edges are derived from parentId.
const TOPOLOGY_FIXTURES = (() => {
  type TopoNode = {
    id: string
    name: string
    type: 'olt' | 'odc' | 'odp' | 'pole' | 'customer'
    status: 'up' | 'down' | 'unknown'
    lat: number
    lng: number
    parentId: string | null
  }
  const nodes: TopoNode[] = []
  const center = { lat: -6.9039, lng: 107.6186 }
  const STATUS_CYCLE: TopoNode['status'][] = ['up', 'up', 'up', 'up', 'down', 'unknown', 'up', 'up']
  let k = 0
  for (let o = 0; o < 2; o++) {
    const oltId = `olt-${o + 1}`
    const oLat = center.lat + (o - 0.5) * 0.02
    const oLng = center.lng + (o - 0.5) * 0.03
    nodes.push({
      id: oltId,
      name: `OLT ${o + 1}`,
      type: 'olt',
      status: 'up',
      lat: oLat,
      lng: oLng,
      parentId: null,
    })
    for (let c = 0; c < 2; c++) {
      const odcId = `${oltId}-odc-${c + 1}`
      const cLat = oLat + (c - 0.5) * 0.012
      const cLng = oLng + (c - 0.5) * 0.016 + 0.006
      nodes.push({
        id: odcId,
        name: `ODC ${o + 1}.${c + 1}`,
        type: 'odc',
        status: STATUS_CYCLE[k++ % STATUS_CYCLE.length] ?? 'up',
        lat: cLat,
        lng: cLng,
        parentId: oltId,
      })
      for (let d = 0; d < 2; d++) {
        const odpId = `${odcId}-odp-${d + 1}`
        const dLat = cLat + (d - 0.5) * 0.008
        const dLng = cLng + (d - 0.5) * 0.01 + 0.005
        nodes.push({
          id: odpId,
          name: `ODP ${o + 1}.${c + 1}.${d + 1}`,
          type: 'odp',
          status: STATUS_CYCLE[k++ % STATUS_CYCLE.length] ?? 'up',
          lat: dLat,
          lng: dLng,
          parentId: odcId,
        })
        const poleId = `${odpId}-pole`
        const pLat = dLat + 0.0025
        const pLng = dLng + 0.003
        nodes.push({
          id: poleId,
          name: `Tiang ${o + 1}.${c + 1}.${d + 1}`,
          type: 'pole',
          status: 'up',
          lat: pLat,
          lng: pLng,
          parentId: odpId,
        })
        for (let u = 0; u < 2; u++) {
          const custId = `${poleId}-cust-${u + 1}`
          nodes.push({
            id: custId,
            name: `Pelanggan ${String.fromCharCode(65 + (k % 26))}${k}`,
            type: 'customer',
            status: STATUS_CYCLE[k++ % STATUS_CYCLE.length] ?? 'up',
            lat: pLat + (u - 0.5) * 0.003,
            lng: pLng + (u - 0.5) * 0.004,
            parentId: poleId,
          })
        }
      }
    }
  }
  return nodes
})()

// Mikrotik PPP: profiles + PPPoE secrets per router.
const PROFILE_PRESETS = [
  { suffix: 'home20', name: 'Home 20', rateLimit: '20M/20M', isIsolir: false },
  { suffix: 'home50', name: 'Home 50', rateLimit: '50M/50M', isIsolir: false },
  {
    suffix: 'pro100',
    name: 'Pro 100',
    rateLimit: '100M/100M',
    isIsolir: false,
  },
  { suffix: 'isolir', name: 'ISOLIR', rateLimit: '512k/512k', isIsolir: true },
]
const MIKROTIK_PROFILE_FIXTURES: PppProfile[] = ROUTER_FIXTURES.flatMap((r) =>
  PROFILE_PRESETS.map((p) => ({
    id: `${r.id}-prof-${p.suffix}`,
    routerId: r.id,
    name: p.name,
    rateLimit: p.rateLimit,
    isIsolir: p.isIsolir,
  })),
)
const MIKROTIK_SECRET_FIXTURES: PppSecret[] = ROUTER_FIXTURES.flatMap((r, ri) =>
  Array.from({ length: 4 }, (_, i) => {
    const preset = PROFILE_PRESETS[i % 3] ?? PROFILE_PRESETS[0]
    const customer = CUSTOMER_FIXTURES[(ri * 4 + i) % CUSTOMER_FIXTURES.length]
    return {
      id: `${r.id}-sec-${i + 1}`,
      routerId: r.id,
      username: `cust${1001 + ri * 4 + i}`,
      profileId: `${r.id}-prof-${preset?.suffix ?? 'home20'}`,
      profileName: preset?.name ?? 'Home 20',
      customerName: customer?.fullName ?? null,
      disabled: i === 3,
      comment: null,
    }
  }),
)
// Active sessions: one per enabled secret.
const MIKROTIK_SESSION_FIXTURES: PppSession[] = MIKROTIK_SECRET_FIXTURES.filter(
  (s) => !s.disabled,
).map((s, i) => {
  const hex = (n: number) => String((n * 37) % 256).padStart(2, '0')
  return {
    id: `${s.id}-sess`,
    routerId: s.routerId,
    username: s.username,
    address: `100.64.${i % 200}.${(i % 50) + 2}`,
    uptime: `${(i % 9) + 1}h${(i * 7) % 60}m`,
    callerId: `AA:BB:CC:${hex(i + 1)}:${hex(i + 2)}:${hex(i + 3)}`,
  }
})
const MIKROTIK_QUEUE_FIXTURES: SimpleQueue[] = ROUTER_FIXTURES.flatMap((r, ri) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `${r.id}-q-${i + 1}`,
    routerId: r.id,
    name: `queue-${ri + 1}-${i + 1}`,
    target: `100.64.${ri}.${i + 2}`,
    maxLimit: ['20M/20M', '50M/50M', '100M/100M'][i] ?? '20M/20M',
  })),
)

// Ticket timeline: one "created" event seeded per ticket.
const TICKET_EVENT_FIXTURES: TicketEvent[] = TICKET_FIXTURES.map((t) => ({
  id: `${t.id}-ev-created`,
  ticketId: t.id,
  kind: 'created',
  author: t.customerName,
  body: t.subject,
  at: t.createdAt,
}))

// Prepaid voucher batches (hotspot/PPPoE). Codes are deterministic in the seed.
// Typed wide (not literal) so the batch handler can unshift new vouchers.
const VOUCHER_BATCHES: Array<{
  batchId: string
  profile: string
  priceIdr: number
  durationDays: number
}> = [
  {
    batchId: 'BATCH-2026-01',
    profile: 'Hotspot 1 Hari',
    priceIdr: 5_000,
    durationDays: 1,
  },
  {
    batchId: 'BATCH-2026-02',
    profile: 'Hotspot 7 Hari',
    priceIdr: 25_000,
    durationDays: 7,
  },
  {
    batchId: 'BATCH-2026-03',
    profile: 'PPPoE 10Mbps 30 Hari',
    priceIdr: 150_000,
    durationDays: 30,
  },
] as const
const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const voucherCode = (n: number) => {
  let s = ''
  let x = n * 2_654_435_761 + 7
  for (let i = 0; i < 8; i++) {
    s += VOUCHER_CHARS.charAt(x % VOUCHER_CHARS.length)
    x = Math.floor(x / VOUCHER_CHARS.length) + (i + 1) * 131
  }
  return `ASH-${s.slice(0, 4)}-${s.slice(4)}`
}
const VOUCHER_FIXTURES = VOUCHER_BATCHES.flatMap((batch, bi) =>
  Array.from({ length: 8 }, (_, j) => {
    const i = bi * 8 + j
    const status = i % 3 === 0 ? 'used' : i % 7 === 0 ? 'expired' : 'unused'
    return {
      id: oid('e0e0e0e0', i),
      code: voucherCode(i),
      batchId: batch.batchId,
      profile: batch.profile,
      priceIdr: batch.priceIdr,
      durationDays: batch.durationDays,
      status,
      createdAt: iso(2026, 4, 1 + bi),
      usedAt: status === 'used' ? iso(2026, 4, 5 + (j % 10)) : null,
      usedBy: status === 'used' ? `Hotspot user ${i}` : null,
    }
  }),
)

// Isolir integration: disable/enable a customer's PPPoE secrets by name.
function setSecretsDisabledByCustomer(name: string | null, disabled: boolean) {
  if (!name) return
  for (const s of MIKROTIK_SECRET_FIXTURES) {
    if (s.customerName === name) s.disabled = disabled
  }
}

// Operator settings (single record). Company profile + billing parameters.
const SETTINGS_FIXTURE = {
  company: {
    name: 'Ashnet',
    address: 'Jl. Merdeka No. 1, Jakarta',
    phone: '0800-1-274638',
    email: 'billing@ashnet.id',
  },
  billing: {
    lateFeeIdr: 25_000,
    dueDays: 10,
    isolirGraceDays: 3,
  },
  tax: {
    pkp: true,
    npwp: '01.234.567.8-901.000',
    ppnRate: PPN_RATE,
  },
}

// Audit trail. Seeded with recent history; mutations append via recordAudit().
const AUDIT_SEED: Array<{
  actor: string
  action: string
  entity: string
  summary: string
}> = [
  {
    actor: 'Admin',
    action: 'billing.run',
    entity: 'Tagihan',
    summary: 'Menjalankan billing periode 2026-05',
  },
  {
    actor: 'Admin',
    action: 'billing.isolir',
    entity: 'Pelanggan',
    summary: 'Isolir massal 6 penunggak',
  },
  {
    actor: 'Staf',
    action: 'invoice.pay',
    entity: 'Tagihan',
    summary: 'Mencatat pembayaran INV-2026-103',
  },
  {
    actor: 'Staf',
    action: 'customer.create',
    entity: 'Pelanggan',
    summary: 'Menambah pelanggan baru',
  },
  {
    actor: 'Admin',
    action: 'voucher.batch',
    entity: 'Voucher',
    summary: 'Membuat 50 voucher Hotspot 1 Hari',
  },
  {
    actor: 'Staf',
    action: 'customer.relocate',
    entity: 'Pelanggan',
    summary: 'Mutasi alamat ke Cimahi',
  },
  {
    actor: 'Admin',
    action: 'reseller.commission',
    entity: 'Reseller',
    summary: 'Mencatat komisi Loket Bandung Kota',
  },
  {
    actor: 'Staf',
    action: 'inventory.assign',
    entity: 'Inventaris',
    summary: 'Memasang ONU SN-500137',
  },
]
const AUDIT_FIXTURES = AUDIT_SEED.map((e, i) => ({
  id: oid('a0d17000', i),
  at: iso(2026, 4, 28 - i),
  actor: e.actor,
  action: e.action,
  entity: e.entity,
  summary: e.summary,
}))

// Append an audit entry. Callers persist via their own persistDb().
function recordAudit(action: string, entity: string, summary: string, actor = 'Admin') {
  AUDIT_FIXTURES.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    entity,
    summary,
  })
}

// ---------------------------------------------------------------------------
// Stateful store — collections persist to localStorage so CRUD survives a
// refresh (dev). Tests reset to the seed before each test (see test/setup.ts).
// ---------------------------------------------------------------------------
// Bump the version suffix whenever a fixture's shape changes so a stale
// localStorage snapshot from an older schema is ignored instead of failing
// Zod validation. v2: invoices gained `lastRemindedAt` (dunning). v3: invoices
// gained `taxAmount`/`taxInvoiceNo`, customers `npwp`, settings `tax`.
const DB_KEY = 'isp-cms-mock-db-v3'

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
  topology: TOPOLOGY_FIXTURES,
  mikrotikProfiles: MIKROTIK_PROFILE_FIXTURES,
  mikrotikSecrets: MIKROTIK_SECRET_FIXTURES,
  mikrotikSessions: MIKROTIK_SESSION_FIXTURES,
  mikrotikQueues: MIKROTIK_QUEUE_FIXTURES,
  ticketEvents: TICKET_EVENT_FIXTURES,
  vouchers: VOUCHER_FIXTURES,
  resellerLedger: RESELLER_LEDGER_FIXTURES,
  stockMovements: STOCK_MOVEMENT_FIXTURES,
  paymentIntents: PAYMENT_INTENT_FIXTURES,
  audit: AUDIT_FIXTURES,
  settings: [SETTINGS_FIXTURE],
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

// `settings` is a single object the handlers hold by reference; replaceAll
// (hydrate/reset) swaps the array element, so re-bind SETTINGS_FIXTURE to it.
function syncSettingsRef() {
  const current = COLLECTIONS.settings?.[0]
  if (current && current !== SETTINGS_FIXTURE && typeof current === 'object') {
    Object.assign(SETTINGS_FIXTURE, current)
  }
  if (COLLECTIONS.settings) COLLECTIONS.settings[0] = SETTINGS_FIXTURE
}

export function resetMockDb() {
  replaceAll(clone(SEED))
  syncSettingsRef()
  persistDb()
}

hydrateDb()
syncSettingsRef()

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
  http.patch('*/api/plans/:id', async ({ params, request }) => {
    const found = PLAN_FIXTURES.find((p) => p.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      name?: string
      speedMbps?: number
      priceMonthly?: number
    }
    if (body.name !== undefined) found.name = body.name
    if (body.speedMbps !== undefined) found.speedMbps = body.speedMbps
    if (body.priceMonthly !== undefined) found.priceMonthly = body.priceMonthly
    persistDb()
    return HttpResponse.json(found)
  }),
  http.post('*/api/plans/:id/archive', ({ params }) => {
    const found = PLAN_FIXTURES.find((p) => p.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'archived'
    persistDb()
    return HttpResponse.json(found)
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
  http.patch('*/api/customers/:id', async ({ params, request }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      fullName?: string
      phone?: string
      email?: string
      address?: string
      planId?: string
    }
    if (body.fullName !== undefined) found.fullName = body.fullName
    if (body.phone !== undefined) found.phone = body.phone
    if (body.email !== undefined) found.email = body.email === '' ? null : body.email
    if (body.address !== undefined) found.address = body.address
    if (body.planId !== undefined) {
      const plan = PLAN_FIXTURES.find((p) => p.id === body.planId)
      if (plan) {
        found.planId = plan.id
        found.planName = plan.name
      }
    }
    persistDb()
    return HttpResponse.json(found)
  }),
  // Soft-delete: mark the subscriber as churned (berhenti).
  http.post('*/api/customers/:id/stop', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'berhenti'
    recordAudit('customer.stop', 'Pelanggan', `Memberhentikan ${found.fullName}`)
    persistDb()
    return HttpResponse.json(found)
  }),
  // Change plan: switch package + prorate the difference into a pending invoice.
  http.post('*/api/customers/:id/change-plan', async ({ params, request }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as { planId: string }
    const newPlan = PLAN_FIXTURES.find((p) => p.id === body.planId)
    if (!newPlan) {
      return new HttpResponse(JSON.stringify({ message: 'Plan not found' }), {
        status: 404,
      })
    }
    const oldPlan = PLAN_FIXTURES.find((p) => p.name === found.planName)
    found.planId = newPlan.id
    found.planName = newPlan.name
    if (found.connection) found.connection.profile = newPlan.name
    // Prorate the upgrade difference over the remaining days of the month.
    const diff = newPlan.priceMonthly - (oldPlan?.priceMonthly ?? 0)
    if (diff > 0) {
      const now = new Date()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const remaining = daysInMonth - now.getDate() + 1
      const prorate = Math.round((diff * remaining) / daysInMonth)
      const due = new Date(now.getTime() + 10 * 86_400_000)
      INVOICE_FIXTURES.unshift({
        id: crypto.randomUUID(),
        invoiceNo: `INV-${now.getFullYear()}-ADJ${9000 + INVOICE_FIXTURES.length}`,
        customerId: found.id,
        customerName: found.fullName,
        periodStart: now.toISOString().slice(0, 10),
        periodEnd: due.toISOString().slice(0, 10),
        amount: prorate,
        lateFee: 0,
        taxAmount: SETTINGS_FIXTURE.tax.pkp ? ppnOf(prorate) : 0,
        taxInvoiceNo: SETTINGS_FIXTURE.tax.pkp ? fakturNo(INVOICE_FIXTURES.length) : null,
        status: 'pending',
        dueDate: due.toISOString().slice(0, 10),
        paidAt: null,
        lastRemindedAt: null,
      })
      found.outstanding += prorate
    }
    persistDb()
    return HttpResponse.json(found)
  }),
  // Relocation (mutasi): move the subscriber to a new address + service area.
  http.post('*/api/customers/:id/relocate', async ({ params, request }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      address: string
      areaName: string
    }
    found.address = body.address
    found.areaName = body.areaName
    const idx = AREA_NAMES.indexOf(body.areaName)
    if (idx >= 0) found.areaId = oid('dddddddd', idx)
    persistDb()
    return HttpResponse.json(found)
  }),
  // Voluntary suspend (berhenti sementara) — reuses the suspended (isolir) state
  // but is triggered by the customer, not by non-payment.
  http.post('*/api/customers/:id/suspend', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'isolir'
    setSecretsDisabledByCustomer(found.fullName, true)
    persistDb()
    return HttpResponse.json(found)
  }),
  // Resume from a voluntary suspension. Unlike /activate it does NOT clear the
  // outstanding balance — the customer still owes whatever they owed.
  http.post('*/api/customers/:id/resume', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'aktif'
    setSecretsDisabledByCustomer(found.fullName, false)
    persistDb()
    return HttpResponse.json(found)
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
      npwp: null,
      resellerName: null,
      connection: null,
      joinedAt: new Date().toISOString(),
    }
    CUSTOMER_FIXTURES.unshift(customer)
    persistDb()
    return HttpResponse.json(customer, { status: 201 })
  }),
  // Onboarding: create the subscriber (status "instalasi") + an install work order.
  http.post('*/api/onboarding', async ({ request }) => {
    const body = (await request.json()) as {
      fullName: string
      phone: string
      email: string
      address: string
      areaName: string
      planId: string
      technician: string
      scheduledAt: string
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
      areaName: body.areaName || (AREA_NAMES[0] ?? 'Bandung Kota'),
      planId: plan?.id ?? oid('bbbbbbbb', 1),
      planName: plan?.name ?? 'Home 20',
      status: 'instalasi' as const,
      outstanding: 0,
      npwp: null,
      resellerName: null,
      connection: null,
      joinedAt: new Date().toISOString(),
    }
    CUSTOMER_FIXTURES.unshift(customer)
    WORKORDER_FIXTURES.unshift({
      id: crypto.randomUUID(),
      code: `WO-${9000 + WORKORDER_FIXTURES.length}`,
      type: 'install' as const,
      customerName: customer.fullName,
      technician: body.technician,
      scheduledAt: new Date(body.scheduledAt).toISOString(),
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    })
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
    setSecretsDisabledByCustomer(found.fullName, true)
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
    setSecretsDisabledByCustomer(found.fullName, false)
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
      amount: found.amount + found.lateFee + found.taxAmount,
      method: body.method,
      paidAt: found.paidAt,
    })
    // Settling a bill recomputes the customer's outstanding and, if they were
    // isolir and now have no overdue left, reactivates them + re-enables PPPoE.
    const customer = CUSTOMER_FIXTURES.find((c) => c.id === found.customerId)
    if (customer) {
      const unpaid = INVOICE_FIXTURES.filter(
        (inv) =>
          inv.customerId === customer.id && (inv.status === 'pending' || inv.status === 'overdue'),
      )
      customer.outstanding = unpaid.reduce(
        (sum, inv) => sum + inv.amount + inv.lateFee + inv.taxAmount,
        0,
      )
      const hasOverdue = unpaid.some((inv) => inv.status === 'overdue')
      if (customer.status === 'isolir' && !hasOverdue) {
        customer.status = 'aktif'
        setSecretsDisabledByCustomer(customer.fullName, false)
      }
    }
    recordAudit('invoice.pay', 'Tagihan', `Mencatat pembayaran ${found.invoiceNo}`)
    persistDb()
    return HttpResponse.json(found)
  }),

  // Billing run: create current-period invoices for active subscribers.
  http.post('*/api/billing/run', () => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const periodStart = `${period}-01`
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    const dueDate = new Date(now.getTime() + 10 * 86_400_000).toISOString().slice(0, 10)
    let created = 0
    for (const c of CUSTOMER_FIXTURES) {
      if (c.status !== 'aktif') continue
      const exists = INVOICE_FIXTURES.some(
        (inv) => inv.customerId === c.id && inv.periodStart === periodStart,
      )
      if (exists) continue
      const plan = PLAN_FIXTURES.find((p) => p.name === c.planName)
      const dpp = plan?.priceMonthly ?? 200_000
      INVOICE_FIXTURES.unshift({
        id: crypto.randomUUID(),
        invoiceNo: `INV-${now.getFullYear()}-${9000 + INVOICE_FIXTURES.length}`,
        customerId: c.id,
        customerName: c.fullName,
        periodStart,
        periodEnd,
        amount: dpp,
        lateFee: 0,
        taxAmount: SETTINGS_FIXTURE.tax.pkp ? ppnOf(dpp) : 0,
        taxInvoiceNo: SETTINGS_FIXTURE.tax.pkp ? fakturNo(INVOICE_FIXTURES.length) : null,
        status: 'pending',
        dueDate,
        paidAt: null,
        lastRemindedAt: null,
      })
      created++
    }
    recordAudit('billing.run', 'Tagihan', `Billing ${period}: ${created} tagihan dibuat`)
    persistDb()
    return HttpResponse.json({ period, created })
  }),
  // Bulk isolir: flag past-due invoices (+denda) then suspend owing actives.
  http.post('*/api/billing/isolir-overdue', () => {
    const today = new Date().toISOString().slice(0, 10)
    let markedOverdue = 0
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'pending' && inv.dueDate < today) {
        inv.status = 'overdue'
        if (inv.lateFee === 0) inv.lateFee = 25_000
        markedOverdue++
      }
    }
    const owed = new Map<string, number>()
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'overdue') {
        owed.set(
          inv.customerId,
          (owed.get(inv.customerId) ?? 0) + inv.amount + inv.lateFee + inv.taxAmount,
        )
      }
    }
    let isolated = 0
    for (const c of CUSTOMER_FIXTURES) {
      const due = owed.get(c.id)
      if (c.status === 'aktif' && due !== undefined) {
        c.status = 'isolir'
        c.outstanding = due
        setSecretsDisabledByCustomer(c.fullName, true)
        isolated++
      }
    }
    recordAudit('billing.isolir', 'Pelanggan', `Isolir massal ${isolated} penunggak`)
    persistDb()
    return HttpResponse.json({ markedOverdue, isolated })
  }),
  // Dunning: stamp a reminder on unpaid invoices. With invoiceIds, only those
  // (unpaid) get reminded; without it, every overdue invoice is reminded.
  http.post('*/api/billing/remind', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      invoiceIds?: string[]
    }
    const ids = body.invoiceIds
    const now = new Date().toISOString()
    let reminded = 0
    for (const inv of INVOICE_FIXTURES) {
      const isUnpaid = inv.status === 'pending' || inv.status === 'overdue'
      if (!isUnpaid) continue
      const targeted = ids ? ids.includes(inv.id) : inv.status === 'overdue'
      if (!targeted) continue
      inv.lastRemindedAt = now
      reminded++
    }
    persistDb()
    return HttpResponse.json({ reminded, channel: 'whatsapp' })
  }),

  // Payments
  http.get('*/api/payments', () =>
    HttpResponse.json({
      items: PAYMENT_FIXTURES,
      total: PAYMENT_FIXTURES.length,
    }),
  ),
  // Payment gateway: create a charge (QRIS/VA/e-wallet) for an invoice.
  http.post('*/api/payments/intent', async ({ request }) => {
    const body = (await request.json()) as {
      invoiceId: string
      channel: string
    }
    const invoice = INVOICE_FIXTURES.find((inv) => inv.id === body.invoiceId)
    if (!invoice) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const isVa = body.channel.startsWith('va_')
    const rand = crypto.randomUUID().replace(/\D/g, '').padEnd(12, '0')
    const now = new Date()
    const intent = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      amount: invoice.amount + invoice.lateFee + invoice.taxAmount,
      channel: body.channel,
      status: 'pending' as const,
      vaNumber: isVa ? `88${rand.slice(0, 14)}` : null,
      qrPayload: isVa ? null : `00020101021226${rand.slice(0, 10)}5204481253033605802ID`,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
      paidAt: null,
    }
    PAYMENT_INTENT_FIXTURES.unshift(intent)
    persistDb()
    return HttpResponse.json(intent, { status: 201 })
  }),
  // Simulated settlement webhook: mark the intent + invoice paid, reconcile AR,
  // reactivate an isolir customer if nothing overdue remains.
  http.post('*/api/payments/intent/:id/confirm', ({ params }) => {
    const intent = PAYMENT_INTENT_FIXTURES.find((p) => p.id === params.id)
    if (!intent) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    if (intent.status === 'paid') return HttpResponse.json(intent)
    const invoice = INVOICE_FIXTURES.find((inv) => inv.id === intent.invoiceId)
    const nowIso = new Date().toISOString()
    intent.status = 'paid'
    intent.paidAt = nowIso
    if (invoice) {
      invoice.status = 'paid'
      invoice.paidAt = nowIso
      const method =
        intent.channel === 'qris' ? 'qris' : intent.channel.startsWith('va_') ? 'va' : 'ewallet'
      PAYMENT_FIXTURES.unshift({
        id: crypto.randomUUID(),
        invoiceNo: invoice.invoiceNo,
        customerName: invoice.customerName,
        amount: invoice.amount + invoice.lateFee + invoice.taxAmount,
        method,
        paidAt: nowIso,
      })
      const customer = CUSTOMER_FIXTURES.find((c) => c.id === invoice.customerId)
      if (customer) {
        const unpaid = INVOICE_FIXTURES.filter(
          (inv) =>
            inv.customerId === customer.id &&
            (inv.status === 'pending' || inv.status === 'overdue'),
        )
        customer.outstanding = unpaid.reduce(
          (sum, inv) => sum + inv.amount + inv.lateFee + inv.taxAmount,
          0,
        )
        const hasOverdue = unpaid.some((inv) => inv.status === 'overdue')
        if (customer.status === 'isolir' && !hasOverdue) {
          customer.status = 'aktif'
          setSecretsDisabledByCustomer(customer.fullName, false)
        }
      }
      recordAudit('payment.gateway', 'Tagihan', `Pembayaran ${intent.channel} ${invoice.invoiceNo}`)
    }
    persistDb()
    return HttpResponse.json(intent)
  }),

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
  http.patch('*/api/devices/:id', async ({ params, request }) => {
    const found = DEVICE_FIXTURES.find((d) => d.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      name?: string
      ipAddress?: string
      areaName?: string
    }
    if (body.name !== undefined) found.name = body.name
    if (body.ipAddress !== undefined) found.ipAddress = body.ipAddress
    if (body.areaName !== undefined) found.areaName = body.areaName
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/devices/:id', ({ params }) => {
    const idx = DEVICE_FIXTURES.findIndex((d) => d.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    DEVICE_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  // Routers (Mikrotik / RADIUS)
  http.get('*/api/routers', () =>
    HttpResponse.json({
      items: ROUTER_FIXTURES,
      total: ROUTER_FIXTURES.length,
    }),
  ),
  http.get('*/api/routers/:id', ({ params }) => {
    const found = ROUTER_FIXTURES.find((r) => r.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  http.post('*/api/routers/:id/sync', ({ params }) => {
    const found = ROUTER_FIXTURES.find((r) => r.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.status = 'online'
    found.lastSyncAt = new Date().toISOString()
    persistDb()
    return HttpResponse.json(found)
  }),
  http.post('*/api/routers/:id/reboot', ({ params }) => {
    const found = ROUTER_FIXTURES.find((r) => r.id === params.id)
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
  }),
  http.post('*/api/routers/:id/test', ({ params }) => {
    const found = ROUTER_FIXTURES.find((r) => r.id === params.id)
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
  }),
  // PPP profiles
  http.get('*/api/routers/:id/profiles', ({ params }) => {
    const items = MIKROTIK_PROFILE_FIXTURES.filter((p) => p.routerId === params.id)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/routers/:id/profiles', async ({ params, request }) => {
    const body = (await request.json()) as { name: string; rateLimit: string }
    const profile = {
      id: crypto.randomUUID(),
      routerId: String(params.id),
      name: body.name,
      rateLimit: body.rateLimit,
      isIsolir: false,
    }
    MIKROTIK_PROFILE_FIXTURES.push(profile)
    persistDb()
    return HttpResponse.json(profile, { status: 201 })
  }),
  http.patch('*/api/routers/:id/profiles/:pid', async ({ params, request }) => {
    const found = MIKROTIK_PROFILE_FIXTURES.find((p) => p.id === params.pid)
    if (!found) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as {
      name?: string
      rateLimit?: string
    }
    if (body.name !== undefined) found.name = body.name
    if (body.rateLimit !== undefined) found.rateLimit = body.rateLimit
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/routers/:id/profiles/:pid', ({ params }) => {
    const idx = MIKROTIK_PROFILE_FIXTURES.findIndex((p) => p.id === params.pid)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    MIKROTIK_PROFILE_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  // PPPoE secrets
  http.get('*/api/routers/:id/secrets', ({ params }) => {
    const items = MIKROTIK_SECRET_FIXTURES.filter((s) => s.routerId === params.id)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/routers/:id/secrets', async ({ params, request }) => {
    const routerId = String(params.id)
    const body = (await request.json()) as {
      username: string
      password?: string
      profileId: string
      customerName?: string
      comment?: string
    }
    const profile = MIKROTIK_PROFILE_FIXTURES.find((p) => p.id === body.profileId)
    const secret = {
      id: crypto.randomUUID(),
      routerId,
      username: body.username,
      profileId: body.profileId,
      profileName: profile?.name ?? '—',
      customerName: body.customerName ?? null,
      disabled: false,
      comment: body.comment ?? null,
    }
    MIKROTIK_SECRET_FIXTURES.push(secret)
    const router = ROUTER_FIXTURES.find((r) => r.id === routerId)
    if (router) router.secretCount += 1
    persistDb()
    return HttpResponse.json(secret, { status: 201 })
  }),
  http.patch('*/api/routers/:id/secrets/:sid', async ({ params, request }) => {
    const found = MIKROTIK_SECRET_FIXTURES.find((s) => s.id === params.sid)
    if (!found) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as {
      username?: string
      profileId?: string
      customerName?: string | null
      comment?: string | null
      disabled?: boolean
    }
    if (body.username !== undefined) found.username = body.username
    if (body.customerName !== undefined) found.customerName = body.customerName
    if (body.comment !== undefined) found.comment = body.comment
    if (body.disabled !== undefined) found.disabled = body.disabled
    if (body.profileId !== undefined) {
      found.profileId = body.profileId
      const profile = MIKROTIK_PROFILE_FIXTURES.find((p) => p.id === body.profileId)
      if (profile) found.profileName = profile.name
    }
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/routers/:id/secrets/:sid', ({ params }) => {
    const idx = MIKROTIK_SECRET_FIXTURES.findIndex((s) => s.id === params.sid)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const [removed] = MIKROTIK_SECRET_FIXTURES.splice(idx, 1)
    const router = ROUTER_FIXTURES.find((r) => r.id === removed?.routerId)
    if (router && router.secretCount > 0) router.secretCount -= 1
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  // Active sessions
  http.get('*/api/routers/:id/sessions', ({ params }) => {
    const items = MIKROTIK_SESSION_FIXTURES.filter((s) => s.routerId === params.id)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/routers/:id/sessions/:sid/disconnect', ({ params }) => {
    const idx = MIKROTIK_SESSION_FIXTURES.findIndex((s) => s.id === params.sid)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    MIKROTIK_SESSION_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  // Simple queues
  http.get('*/api/routers/:id/queues', ({ params }) => {
    const items = MIKROTIK_QUEUE_FIXTURES.filter((q) => q.routerId === params.id)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/routers/:id/queues', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string
      target: string
      maxLimit: string
    }
    const queue = {
      id: crypto.randomUUID(),
      routerId: String(params.id),
      name: body.name,
      target: body.target,
      maxLimit: body.maxLimit,
    }
    MIKROTIK_QUEUE_FIXTURES.push(queue)
    persistDb()
    return HttpResponse.json(queue, { status: 201 })
  }),
  http.patch('*/api/routers/:id/queues/:qid', async ({ params, request }) => {
    const found = MIKROTIK_QUEUE_FIXTURES.find((q) => q.id === params.qid)
    if (!found) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as {
      name?: string
      target?: string
      maxLimit?: string
    }
    if (body.name !== undefined) found.name = body.name
    if (body.target !== undefined) found.target = body.target
    if (body.maxLimit !== undefined) found.maxLimit = body.maxLimit
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/routers/:id/queues/:qid', ({ params }) => {
    const idx = MIKROTIK_QUEUE_FIXTURES.findIndex((q) => q.id === params.qid)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    MIKROTIK_QUEUE_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  // Work orders
  http.get('*/api/work-orders', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(WORKORDER_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),
  // Complete a WO; an install also activates + provisions + invoices the customer.
  http.post('*/api/work-orders/:id/complete', ({ params }) => {
    const wo = WORKORDER_FIXTURES.find((w) => w.id === params.id)
    if (!wo) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    wo.status = 'done'
    if (wo.type === 'install') {
      const customer = CUSTOMER_FIXTURES.find((c) => c.fullName === wo.customerName)
      if (customer) {
        const seq = CUSTOMER_FIXTURES.indexOf(customer)
        customer.status = 'aktif'
        customer.connection = {
          type: 'gpon',
          pppoeUsername: customer.customerNo.toLowerCase().replace('-', ''),
          profile: customer.planName,
          ipAddress: `100.64.${100 + (seq % 150)}.2`,
          onuSerial: `ZTEG${String(20000000 + seq)}`,
          olt: 'OLT-1',
          ponPort: `0/${seq % 8}/${seq % 16}`,
          rxPower: -20 - (seq % 6),
        }
        const plan = PLAN_FIXTURES.find((p) => p.name === customer.planName)
        const now = new Date()
        const due = new Date(now.getTime() + 10 * 86_400_000)
        const dpp = plan?.priceMonthly ?? 200_000
        INVOICE_FIXTURES.unshift({
          id: crypto.randomUUID(),
          invoiceNo: `INV-${now.getFullYear()}-${9000 + INVOICE_FIXTURES.length}`,
          customerId: customer.id,
          customerName: customer.fullName,
          periodStart: now.toISOString().slice(0, 10),
          periodEnd: due.toISOString().slice(0, 10),
          amount: dpp,
          lateFee: 0,
          taxAmount: SETTINGS_FIXTURE.tax.pkp ? ppnOf(dpp) : 0,
          taxInvoiceNo: SETTINGS_FIXTURE.tax.pkp ? fakturNo(INVOICE_FIXTURES.length) : null,
          status: 'pending',
          dueDate: due.toISOString().slice(0, 10),
          paidAt: null,
          lastRemindedAt: null,
        })
      }
    }
    persistDb()
    return HttpResponse.json(wo)
  }),

  // Resellers
  http.get('*/api/resellers', () =>
    HttpResponse.json({
      items: RESELLER_FIXTURES,
      total: RESELLER_FIXTURES.length,
    }),
  ),
  http.get('*/api/resellers/:id', ({ params }) => {
    const found = RESELLER_FIXTURES.find((r) => r.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  // Deposit/commission ledger for a reseller (newest first).
  http.get('*/api/resellers/:id/ledger', ({ params }) => {
    const items = RESELLER_LEDGER_FIXTURES.filter((e) => e.resellerId === params.id).sort((a, b) =>
      a.at < b.at ? 1 : -1,
    )
    return HttpResponse.json({ items, total: items.length })
  }),
  // Append a ledger entry. topup/commission add to the balance; deduction/
  // withdrawal subtract. Rejects a move that would take the balance negative.
  http.post('*/api/resellers/:id/ledger', async ({ params, request }) => {
    const reseller = RESELLER_FIXTURES.find((r) => r.id === params.id)
    if (!reseller) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      type: 'topup' | 'commission' | 'deduction' | 'withdrawal'
      amount: number
      note?: string
    }
    const credit = body.type === 'topup' || body.type === 'commission'
    const signed = credit ? Math.abs(body.amount) : -Math.abs(body.amount)
    const nextBalance = reseller.balance + signed
    if (nextBalance < 0) {
      return new HttpResponse(JSON.stringify({ message: 'Saldo tidak mencukupi' }), { status: 422 })
    }
    reseller.balance = nextBalance
    RESELLER_LEDGER_FIXTURES.unshift({
      id: crypto.randomUUID(),
      resellerId: reseller.id,
      type: body.type,
      amount: signed,
      note: body.note ?? '',
      balanceAfter: nextBalance,
      at: new Date().toISOString(),
    })
    persistDb()
    return HttpResponse.json(reseller)
  }),
  http.patch('*/api/resellers/:id', async ({ params, request }) => {
    const found = RESELLER_FIXTURES.find((r) => r.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      name?: string
      area?: string
      commissionPct?: number
      status?: 'active' | 'inactive'
    }
    if (body.name !== undefined) found.name = body.name
    if (body.area !== undefined) found.area = body.area
    if (body.commissionPct !== undefined) found.commissionPct = body.commissionPct
    if (body.status !== undefined) found.status = body.status
    persistDb()
    return HttpResponse.json(found)
  }),

  // Vouchers (prepaid hotspot/PPPoE)
  http.get('*/api/vouchers', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(VOUCHER_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),
  // Generate a batch of identical unused vouchers.
  http.post('*/api/vouchers/batch', async ({ request }) => {
    const body = (await request.json()) as {
      count: number
      profile: string
      priceIdr: number
      durationDays: number
    }
    const count = Math.max(1, Math.min(500, Math.floor(body.count)))
    const batchId = `BATCH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const createdAt = new Date().toISOString()
    for (let i = 0; i < count; i++) {
      const raw = crypto.randomUUID().replace(/-/g, '').toUpperCase()
      VOUCHER_FIXTURES.unshift({
        id: crypto.randomUUID(),
        code: `ASH-${raw.slice(0, 4)}-${raw.slice(4, 8)}`,
        batchId,
        profile: body.profile,
        priceIdr: body.priceIdr,
        durationDays: body.durationDays,
        status: 'unused',
        createdAt,
        usedAt: null,
        usedBy: null,
      })
    }
    recordAudit('voucher.batch', 'Voucher', `Membuat ${count} voucher ${body.profile}`)
    persistDb()
    return HttpResponse.json({ batchId, created: count })
  }),
  // Mark a voucher redeemed.
  http.post('*/api/vouchers/:id/redeem', ({ params }) => {
    const found = VOUCHER_FIXTURES.find((v) => v.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.status = 'used'
    found.usedAt = new Date().toISOString()
    found.usedBy = found.usedBy ?? 'Admin (manual)'
    persistDb()
    return HttpResponse.json(found)
  }),

  // Inventory
  http.get('*/api/inventory', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const items = filterByStatus(INVENTORY_FIXTURES, status)
    return HttpResponse.json({ items, total: items.length })
  }),
  // Full stock movement history (newest first).
  http.get('*/api/inventory/movements', () => {
    const items = [...STOCK_MOVEMENT_FIXTURES].sort((a, b) => (a.at < b.at ? 1 : -1))
    return HttpResponse.json({ items, total: items.length })
  }),
  // Stock-in: register a new device into the warehouse + log an "in" movement.
  http.post('*/api/inventory', async ({ request }) => {
    const body = (await request.json()) as {
      kind: 'onu' | 'router' | 'mikrotik'
      serial: string
    }
    const item = {
      id: crypto.randomUUID(),
      kind: body.kind,
      serial: body.serial,
      status: 'warehouse' as const,
      assignedTo: null,
    }
    INVENTORY_FIXTURES.unshift(item)
    STOCK_MOVEMENT_FIXTURES.unshift({
      id: crypto.randomUUID(),
      itemId: item.id,
      serial: item.serial,
      kind: item.kind,
      type: 'in',
      note: 'Stok masuk',
      at: new Date().toISOString(),
    })
    persistDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  // Move an item: assign (→ installed), return (→ warehouse), or mark broken.
  http.post('*/api/inventory/:id/move', async ({ params, request }) => {
    const found = INVENTORY_FIXTURES.find((it) => it.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      type: 'assign' | 'return' | 'broken'
      note?: string
    }
    let note = body.note ?? ''
    if (body.type === 'assign') {
      found.status = 'installed'
      found.assignedTo = body.note ?? found.assignedTo ?? 'Pelanggan'
      note = found.assignedTo ?? ''
    } else if (body.type === 'return') {
      found.status = 'warehouse'
      found.assignedTo = null
      note = body.note || 'Dikembalikan ke gudang'
    } else {
      found.status = 'broken'
      note = body.note || 'Rusak'
    }
    STOCK_MOVEMENT_FIXTURES.unshift({
      id: crypto.randomUUID(),
      itemId: found.id,
      serial: found.serial,
      kind: found.kind,
      type: body.type,
      note,
      at: new Date().toISOString(),
    })
    persistDb()
    return HttpResponse.json(found)
  }),
  http.patch('*/api/inventory/:id', async ({ params, request }) => {
    const found = INVENTORY_FIXTURES.find((it) => it.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      kind?: 'onu' | 'router' | 'mikrotik'
      serial?: string
      status?: 'warehouse' | 'installed' | 'broken'
      assignedTo?: string | null
    }
    if (body.kind !== undefined) found.kind = body.kind
    if (body.serial !== undefined) found.serial = body.serial
    if (body.status !== undefined) found.status = body.status
    if (body.assignedTo !== undefined) found.assignedTo = body.assignedTo
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/inventory/:id', ({ params }) => {
    const idx = INVENTORY_FIXTURES.findIndex((it) => it.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    INVENTORY_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
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
    const now = Date.now()
    const slaHours = SLA_HOURS[body.priority] ?? 24
    const ticket = {
      id: crypto.randomUUID(),
      code: `TKT-${9000 + TICKET_FIXTURES.length}`,
      subject: body.subject,
      customerName: body.customerName,
      priority: body.priority,
      status: 'open' as const,
      assignee: null,
      slaDueAt: new Date(now + slaHours * 3_600_000).toISOString(),
      createdAt: new Date(now).toISOString(),
    }
    TICKET_FIXTURES.unshift(ticket)
    persistDb()
    return HttpResponse.json(ticket, { status: 201 })
  }),
  // Update a ticket: assign, transition status, edit subject/priority.
  http.patch('*/api/tickets/:id', async ({ params, request }) => {
    const found = TICKET_FIXTURES.find((t) => t.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      subject?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      status?: 'open' | 'in_progress' | 'resolved' | 'breached'
      assignee?: string | null
    }
    if (body.subject !== undefined) found.subject = body.subject
    if (body.assignee !== undefined) {
      found.assignee = body.assignee
      TICKET_EVENT_FIXTURES.push({
        id: crypto.randomUUID(),
        ticketId: found.id,
        kind: 'assign',
        author: USER_FIXTURE.fullName,
        body: body.assignee ? `Ditugaskan ke ${body.assignee}` : 'Assign dilepas',
        at: new Date().toISOString(),
      })
    }
    if (body.priority !== undefined) {
      found.priority = body.priority
      // Recompute SLA deadline from creation when priority changes.
      const slaHours = SLA_HOURS[body.priority] ?? 24
      found.slaDueAt = new Date(
        new Date(found.createdAt).getTime() + slaHours * 3_600_000,
      ).toISOString()
    }
    if (body.status !== undefined) {
      // Resolving past the SLA deadline records a breach instead of resolved.
      found.status =
        body.status === 'resolved' && new Date(found.slaDueAt).getTime() < Date.now()
          ? 'breached'
          : body.status
      TICKET_EVENT_FIXTURES.push({
        id: crypto.randomUUID(),
        ticketId: found.id,
        kind: 'status',
        author: USER_FIXTURE.fullName,
        body: `Status → ${found.status}`,
        at: new Date().toISOString(),
      })
    }
    persistDb()
    return HttpResponse.json(found)
  }),
  http.get('*/api/tickets/:id', ({ params }) => {
    const found = TICKET_FIXTURES.find((t) => t.id === params.id)
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(JSON.stringify({ message: 'Not found' }), {
          status: 404,
        })
  }),
  http.get('*/api/tickets/:id/events', ({ params }) => {
    const items = TICKET_EVENT_FIXTURES.filter((e) => e.ticketId === params.id).sort((a, b) =>
      a.at.localeCompare(b.at),
    )
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/tickets/:id/comments', async ({ params, request }) => {
    const ticket = TICKET_FIXTURES.find((t) => t.id === params.id)
    if (!ticket) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as { body: string }
    TICKET_EVENT_FIXTURES.push({
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      kind: 'comment',
      author: USER_FIXTURE.fullName,
      body: body.body,
      at: new Date().toISOString(),
    })
    persistDb()
    return new HttpResponse(null, { status: 201 })
  }),
  http.post('*/api/tickets/:id/work-order', ({ params }) => {
    const ticket = TICKET_FIXTURES.find((t) => t.id === params.id)
    if (!ticket) return new HttpResponse(null, { status: 404 })
    const wo = {
      id: crypto.randomUUID(),
      code: `WO-${9000 + WORKORDER_FIXTURES.length}`,
      type: 'repair' as const,
      customerName: ticket.customerName,
      technician: null,
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    }
    WORKORDER_FIXTURES.unshift(wo)
    TICKET_EVENT_FIXTURES.push({
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      kind: 'workorder',
      author: USER_FIXTURE.fullName,
      body: `Work order ${wo.code} dibuat`,
      at: new Date().toISOString(),
    })
    persistDb()
    return HttpResponse.json(wo, { status: 201 })
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

  // Network topology
  http.get('*/api/topology', () =>
    HttpResponse.json({
      items: TOPOLOGY_FIXTURES,
      total: TOPOLOGY_FIXTURES.length,
    }),
  ),
  http.post('*/api/topology', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      type: 'olt' | 'odc' | 'odp' | 'pole' | 'customer'
      status: 'up' | 'down' | 'unknown'
      parentId: string | null
      lat: number
      lng: number
    }
    const node = { id: crypto.randomUUID(), ...body }
    TOPOLOGY_FIXTURES.push(node)
    persistDb()
    return HttpResponse.json(node, { status: 201 })
  }),
  http.patch('*/api/topology/:id', async ({ params, request }) => {
    const found = TOPOLOGY_FIXTURES.find((n) => n.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      name?: string
      type?: 'olt' | 'odc' | 'odp' | 'pole' | 'customer'
      status?: 'up' | 'down' | 'unknown'
      parentId?: string | null
      lat?: number
      lng?: number
    }
    if (body.name !== undefined) found.name = body.name
    if (body.type !== undefined) found.type = body.type
    if (body.status !== undefined) found.status = body.status
    if (body.parentId !== undefined) found.parentId = body.parentId
    if (body.lat !== undefined) found.lat = body.lat
    if (body.lng !== undefined) found.lng = body.lng
    persistDb()
    return HttpResponse.json(found)
  }),
  http.delete('*/api/topology/:id', ({ params }) => {
    const idx = TOPOLOGY_FIXTURES.findIndex((n) => n.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const removed = TOPOLOGY_FIXTURES[idx]
    // Reparent any children up to the removed node's parent so the tree stays connected.
    if (removed) {
      for (const n of TOPOLOGY_FIXTURES) {
        if (n.parentId === removed.id) n.parentId = removed.parentId
      }
    }
    TOPOLOGY_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  // Settings (single record)
  http.get('*/api/settings', () => HttpResponse.json(SETTINGS_FIXTURE)),
  http.patch('*/api/settings', async ({ request }) => {
    const body = (await request.json()) as {
      company?: typeof SETTINGS_FIXTURE.company
      billing?: typeof SETTINGS_FIXTURE.billing
      tax?: typeof SETTINGS_FIXTURE.tax
    }
    if (body.company) SETTINGS_FIXTURE.company = body.company
    if (body.billing) SETTINGS_FIXTURE.billing = body.billing
    if (body.tax) SETTINGS_FIXTURE.tax = body.tax
    recordAudit('settings.update', 'Pengaturan', 'Memperbarui pengaturan aplikasi')
    persistDb()
    return HttpResponse.json(SETTINGS_FIXTURE)
  }),

  // Audit log (newest first)
  http.get('*/api/audit', () =>
    HttpResponse.json({ items: AUDIT_FIXTURES, total: AUDIT_FIXTURES.length }),
  ),
]
