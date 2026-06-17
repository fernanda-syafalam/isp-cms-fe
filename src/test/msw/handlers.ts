import { HttpResponse, http } from 'msw'

import { ratioCount, routeLength } from '@/features/topology/lib/graph'
import { projectNodeMeta } from '@/features/topology/lib/projection'
import { SLA_HOURS } from '@/lib/sla'
import type { AuditEntry } from '@/schemas/audit'
import { UpdateBranchSchema } from '@/schemas/branch'
import { CustomerDropSchema, UpdateCableRouteSchema } from '@/schemas/cable'
import type { IpPool, PppProfile, PppSecret, PppSession, SimpleQueue } from '@/schemas/mikrotik'
import type { SplitterRatio } from '@/schemas/splitter'
import type { TicketEvent } from '@/schemas/ticket'
import { UpdateUserSchema } from '@/schemas/user'
import type { NodeLifecycle } from '@/schemas/topology'
import { CreateNodeSchema, UpdateNodeSchema } from '@/schemas/topology'

import {
  allocateDrop,
  deriveCabling,
  freeDrop,
  rehomeCustomerDrop,
  syncNodeGeometry,
} from './cablingFixtures'
import { applyListQuery } from './listQuery'

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

// Service areas = kecamatan around Jepara, Jawa Tengah (demo locale).
const AREA_NAMES: string[] = [
  'Jepara',
  'Tahunan',
  'Pecangaan',
  'Kalinyamatan',
  'Mlonggo',
  'Bangsri',
  'Mayong',
  'Batealit',
]
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
// Reseller storefronts. RESELLER_NAMES (with nulls) is sprinkled onto customers
// as `resellerName`; RESELLER_CO_NAMES seeds the matching reseller records so
// the reseller → customers join resolves.
const RESELLER_CO_NAMES = ['Loket Andi', 'Agen Budi', 'Loket Citra'] as const
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
    address: `Jl. Pemuda No. ${i + 1}, Jepara`,
    areaId: oid('dddddddd', i % AREA_NAMES.length),
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara',
    planId: plan?.id ?? oid('bbbbbbbb', 1),
    planName: plan?.name ?? 'Home 20',
    status,
    outstanding: status === 'isolir' ? 200_000 + (i % 3) * 150_000 : 0,
    // Every 4th subscriber is a PKP/business account with an NPWP.
    npwp:
      i % 4 === 0
        ? `0${String(10000000 + i * 7).slice(0, 8)}.${String(100 + i).slice(0, 3)}.000`
        : null,
    ktp: i % 3 === 0 ? `327${String(1000000000000 + i * 7)}`.slice(0, 16) : null,
    // Most active/isolir subscribers already consented at onboarding.
    consentAt: provisioned ? iso(2025, i % 12, 1 + (i % 27)) : null,
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
  invoiceId: inv.id,
  invoiceNo: inv.invoiceNo,
  customerId: inv.customerId,
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
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara',
    lastSeenAt: iso(2026, 5, 5),
    // OLT devices map to a real topology OLT node so "Lihat di topologi" works.
    topologyNodeId: type === 'olt' ? `olt-${(Math.floor(i / 3) % 2) + 1}` : null,
  }
})

const ROUTER_STATUS = ['online', 'online', 'offline'] as const
const ROUTER_MODELS = ['RB5009', 'CCR2004', 'RB4011', 'hAP ax3'] as const
const ROUTER_VERSIONS = ['7.15.3', '7.14.2', '7.13.5', '6.49.13'] as const
const ROUTER_FIXTURES = Array.from({ length: 6 }, (_, i) => ({
  id: oid('a7a7a7a7', i),
  name: `MIKROTIK-${AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara'}`,
  address: `10.20.${i}.1`,
  apiPort: 8728,
  username: 'api',
  model: ROUTER_MODELS[i % ROUTER_MODELS.length] ?? 'RB5009',
  version: ROUTER_VERSIONS[i % ROUTER_VERSIONS.length] ?? '7.15.3',
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
    customerId: (customer?.id ?? null) as string | null,
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
  region: 'Jawa Tengah',
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
    customerId: (customer?.id ?? null) as string | null,
    customerName: customer?.fullName ?? 'Pelanggan A0',
    technician: TECHNICIANS[i % TECHNICIANS.length] ?? null,
    scheduledAt: iso(2026, 5, 6 + (i % 5)),
    status: WORKORDER_STATUS[i % WORKORDER_STATUS.length] ?? 'scheduled',
    createdAt: iso(2026, 5, 3),
  }
})

const RESELLER_STATUS = ['active', 'active', 'inactive'] as const
const RESELLER_FIXTURES = Array.from({ length: 6 }, (_, i) => {
  // First entries take the names customers actually reference, so the reseller
  // → customers join resolves; the rest are synthetic storefronts per area.
  const name: string =
    RESELLER_CO_NAMES[i] ??
    (i % 2 === 0
      ? `Loket ${AREA_NAMES[i % AREA_NAMES.length]}`
      : `Agen ${AREA_NAMES[i % AREA_NAMES.length]}`)
  return {
    id: oid('a3a3a3a3', i),
    name,
    area: AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara',
    balance: 500_000 + i * 250_000,
    commissionPct: 0.05 + (i % 3) * 0.02,
    customerCount: CUSTOMER_FIXTURES.filter((c) => c.resellerName === name).length,
    status: RESELLER_STATUS[i % RESELLER_STATUS.length] ?? 'active',
  }
})

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
    assignedCustomerId: (status === 'installed' ? (customer?.id ?? null) : null) as string | null,
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

// Network topology: OLT → ODC → ODP → Tiang → Pelanggan, around Jepara.
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
    meta?: {
      ipAddress?: string
      model?: string
      splitter?: string
      portsUsed?: number
      portsTotal?: number
      rxPowerDbm?: number
      uptimePct?: number
      customerId?: string
      planName?: string
      coreNo?: number
      lifecycle?: NodeLifecycle
      maintenance?: boolean
    }
  }
  const nodes: TopoNode[] = []
  const poles: Array<{ id: string; lat: number; lng: number }> = []
  const center = { lat: -6.5514, lng: 110.6811 } // Kota Jepara, Jawa Tengah;
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
      meta: {
        model: 'ZTE C320',
        ipAddress: `10.20.${o + 1}.1`,
        portsUsed: 6 + o * 2,
        portsTotal: 16,
        uptimePct: 99.95,
      },
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
        meta: {
          ipAddress: `10.20.${o + 1}.${10 + c}`,
          splitter: '1:4',
          portsUsed: 2 + c,
          portsTotal: 4,
          uptimePct: 99.9,
        },
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
          meta: {
            splitter: '1:8',
            portsUsed: 4 + ((o + c + d) % 4),
            portsTotal: 8,
            rxPowerDbm: -20 - ((o + c + d) % 6),
            uptimePct: 99.8,
          },
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
        poles.push({ id: poleId, lat: pLat, lng: pLng })
      }
    }
  }

  // Attach REAL subscribers as customer nodes (id `${customerId}-node`) so the
  // map mirrors the customer base and customer→topology deep-links resolve.
  // NETWORK status (map color) is distinct from BILLING lifecycle: an isolir
  // (suspended for non-payment) customer is still optically `up` — the fiber is
  // not cut — so dispatch must not mistake "belum bayar" for "fiber putus".
  // aktif/isolir → up (light present); berhenti (disconnected) / instalasi
  // (not yet provisioned) → unknown. `meta.lifecycle` carries the billing state.
  const CUST_STATUS: Record<string, TopoNode['status']> = {
    aktif: 'up',
    isolir: 'up',
    berhenti: 'unknown',
    instalasi: 'unknown',
    prospek: 'unknown',
  }
  const subscribers = CUSTOMER_FIXTURES.filter((c) => c.status !== 'prospek')
  // A loose-tube cable: each pole's feeder is a distinct buffer tube; customers
  // on it are sequential cores within that tube. coreNo is the GLOBAL fiber
  // number (tube*12 + core), so fiberId() resolves tube color + core color.
  const corePerPole = new Map<string, number>()
  subscribers.forEach((c, i) => {
    const poleIndex = i % poles.length
    const pole = poles[poleIndex]
    if (!pole) return
    const coreInTube = (corePerPole.get(pole.id) ?? 0) + 1
    corePerPole.set(pole.id, coreInTube)
    const coreNo = poleIndex * 12 + coreInTube // global fiber number
    nodes.push({
      id: `${c.id}-node`,
      name: c.fullName,
      type: 'customer',
      status: CUST_STATUS[c.status] ?? 'unknown',
      lat: pole.lat + ((i % 3) - 1) * 0.0016,
      lng: pole.lng + ((((i / 3) | 0) % 3) - 1) * 0.0018,
      parentId: pole.id,
      meta: {
        customerId: c.id,
        planName: c.planName,
        coreNo,
        lifecycle: c.status,
        ...(c.connection?.rxPower != null ? { rxPowerDbm: c.connection.rxPower } : {}),
        ...(c.connection?.onuSerial ? { onuSerial: c.connection.onuSerial } : {}),
        ...(c.connection?.ponPort ? { ponPort: c.connection.ponPort } : {}),
        ...(c.phone ? { phone: c.phone } : {}),
      },
    })
  })
  return nodes
})()

// OSP cabling layer, DERIVED from the topology nodes so the two stay consistent.
// These become live MSW collections; the topology GET projects node.meta from
// them (splitter/ports/coreNo). See cablingFixtures.ts + lib/projection.ts.
const _cabling = deriveCabling(TOPOLOGY_FIXTURES)
const CABLE_FIXTURES = _cabling.cables
const STRAND_FIXTURES = _cabling.strands
const SPLITTER_FIXTURES = _cabling.splitters
const CLOSURE_FIXTURES = _cabling.closures
const SPLICE_FIXTURES = _cabling.splices
const CIRCUIT_FIXTURES = _cabling.circuits
// Bundle of live arrays for the shared allocateDrop/freeDrop capacity mutators.
const CABLING_STORE = {
  cables: CABLE_FIXTURES,
  strands: STRAND_FIXTURES,
  splitters: SPLITTER_FIXTURES,
  closures: CLOSURE_FIXTURES,
  splices: SPLICE_FIXTURES,
  circuits: CIRCUIT_FIXTURES,
}

// Create or re-size an ODC/ODP splitter to a ratio. Growing appends free ports;
// shrinking is refused if it would drop an occupied port (so live drops aren't
// orphaned). Used by the node create/edit handlers.
function setSplitterRatio(nodeId: string, ratio: SplitterRatio) {
  const newSize = ratioCount(ratio)
  const existing = SPLITTER_FIXTURES.find((s) => s.nodeId === nodeId)
  if (!existing) {
    SPLITTER_FIXTURES.push({
      id: `${nodeId}-splitter`,
      nodeId,
      ratio,
      inCableId: null,
      inStrandId: null,
      ports: Array.from({ length: newSize }, (_, i) => ({
        portNo: i + 1,
        outNodeId: null,
        customerId: null,
        strandId: null,
      })),
    })
    return
  }
  if (newSize < existing.ports.length) {
    if (existing.ports.slice(newSize).some((p) => p.outNodeId !== null)) return // would orphan a drop
    existing.ports.length = newSize
  } else {
    for (let i = existing.ports.length; i < newSize; i++) {
      existing.ports.push({
        portNo: i + 1,
        outNodeId: null,
        customerId: null,
        strandId: null,
      })
    }
  }
  existing.ratio = ratio
}

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
      customerId: customer?.id ?? null,
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

// IP pools per router — address ranges for PPPoE allocation (provisioning).
const MIKROTIK_POOL_FIXTURES: IpPool[] = ROUTER_FIXTURES.map((r, ri) => ({
  id: `${r.id}-pool-1`,
  routerId: r.id,
  name: `pool-pppoe-${ri + 1}`,
  ranges: `100.64.${ri}.2-100.64.${ri}.254`,
  totalAddresses: 253,
  usedAddresses: 40 + ri * 25,
}))

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

// Reflect a subscriber's lifecycle on its topology node (created at onboarding).
// Billing state is recorded on `meta.lifecycle`; the NETWORK status stays honest
// and is derived from it, so dispatch never mistakes "belum bayar" for "fiber
// putus": an isolir (suspended) customer is still optically `up` (the fiber is
// not cut), while berhenti (disconnected) reads `unknown`.
function setTopoCustomerLifecycle(name: string, lifecycle: NodeLifecycle) {
  const status: 'up' | 'down' | 'unknown' =
    lifecycle === 'aktif' || lifecycle === 'isolir' ? 'up' : 'unknown'
  for (const n of TOPOLOGY_FIXTURES) {
    if (n.type === 'customer' && n.name === name) {
      n.status = status
      n.meta = { ...n.meta, lifecycle }
    }
  }
}

// Operator settings (single record). Company profile + billing parameters.
const SETTINGS_FIXTURE = {
  company: {
    name: 'Jepara Net',
    address: 'Jl. Pemuda No. 12, Jepara, Jawa Tengah',
    phone: '0291-591234',
    email: 'billing@jeparanet.id',
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
    summary: 'Mutasi alamat ke Pecangaan',
  },
  {
    actor: 'Admin',
    action: 'reseller.commission',
    entity: 'Reseller',
    summary: 'Mencatat komisi Loket Andi',
  },
  {
    actor: 'Staf',
    action: 'inventory.assign',
    entity: 'Inventaris',
    summary: 'Memasang ONU SN-500137',
  },
]
const AUDIT_FIXTURES: AuditEntry[] = AUDIT_SEED.map((e, i) => ({
  id: oid('a0d17000', i),
  at: iso(2026, 4, 28 - i),
  actor: e.actor,
  action: e.action,
  entity: e.entity,
  summary: e.summary,
}))

// Append an audit entry. Callers persist via their own persistDb().
function recordAudit(
  action: string,
  entity: string,
  summary: string,
  actor = 'Admin',
  entityId?: string,
) {
  AUDIT_FIXTURES.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    entity,
    summary,
    ...(entityId ? { entityId } : {}),
  })
}

// WhatsApp notification templates (per lifecycle event) + a send log.
const NOTIFICATION_TEMPLATE_SEED: Array<{
  event: string
  name: string
  body: string
  enabled: boolean
}> = [
  {
    event: 'invoice_created',
    name: 'Tagihan terbit',
    body: 'Halo {nama}, tagihan {no_tagihan} sebesar {jumlah} telah terbit, jatuh tempo {jatuh_tempo}.',
    enabled: true,
  },
  {
    event: 'due_soon',
    name: 'Pengingat H-3',
    body: 'Halo {nama}, tagihan {no_tagihan} ({jumlah}) jatuh tempo {jatuh_tempo}. Mohon segera dibayar ya.',
    enabled: true,
  },
  {
    event: 'overdue',
    name: 'Terlambat',
    body: 'Halo {nama}, tagihan {no_tagihan} ({jumlah}) sudah lewat jatuh tempo. Segera bayar untuk menghindari isolir.',
    enabled: true,
  },
  {
    event: 'isolir',
    name: 'Isolir',
    body: 'Halo {nama}, layanan Anda diisolir karena tagihan {no_tagihan} belum dibayar. Bayar untuk reaktivasi otomatis.',
    enabled: true,
  },
  {
    event: 'paid',
    name: 'Lunas',
    body: 'Terima kasih {nama}, pembayaran tagihan {no_tagihan} sebesar {jumlah} telah kami terima.',
    enabled: true,
  },
  {
    event: 'ticket_update',
    name: 'Update tiket',
    body: 'Halo {nama}, ada pembaruan pada laporan gangguan Anda. Tim kami sedang menindaklanjuti.',
    enabled: false,
  },
]
const NOTIFICATION_TEMPLATE_FIXTURES = NOTIFICATION_TEMPLATE_SEED.map((t, i) => ({
  id: oid('aff1aff1', i),
  event: t.event,
  name: t.name,
  channel: 'whatsapp' as const,
  body: t.body,
  enabled: t.enabled,
}))
const NOTIFICATION_LOG_FIXTURES = Array.from({ length: 6 }, (_, i) => {
  const tpl = NOTIFICATION_TEMPLATE_SEED[i % NOTIFICATION_TEMPLATE_SEED.length]
  return {
    id: oid('a106a106', i),
    to: `0812${String(10_000_000 + i)}`,
    templateName: tpl?.name ?? 'Tagihan terbit',
    channel: 'whatsapp' as const,
    status: (i % 5 === 0 ? 'failed' : 'sent') as 'sent' | 'failed',
    body: 'Halo Pelanggan, tagihan INV-2026-100 sebesar Rp250.000 telah terbit.',
    at: iso(2026, 4, 20 - i),
  }
})

// Render a template body with sample values (mock; real send hits the gateway).
function renderTemplate(body: string): string {
  return body
    .replaceAll('{nama}', 'Budi Santoso')
    .replaceAll('{no_tagihan}', 'INV-2026-100')
    .replaceAll('{jumlah}', 'Rp250.000')
    .replaceAll('{jatuh_tempo}', '10 Mei 2026')
}

// Record a dunning WhatsApp reminder in the notification log so "Kirim
// pengingat" / the scheduler shows up in the WA history (Notifikasi WA).
function logReminder(inv: {
  customerName: string
  invoiceNo: string
  amount: number
  lateFee: number
  taxAmount: number
}) {
  const cust = CUSTOMER_FIXTURES.find((c) => c.fullName === inv.customerName)
  const total = inv.amount + inv.lateFee + inv.taxAmount
  NOTIFICATION_LOG_FIXTURES.unshift({
    id: crypto.randomUUID(),
    to: cust?.phone ?? '0812-0000-0000',
    templateName: 'Pengingat tagihan',
    channel: 'whatsapp' as const,
    status: 'sent' as const,
    body: `Halo ${inv.customerName}, tagihan ${inv.invoiceNo} sebesar Rp${total.toLocaleString('id-ID')} segera jatuh tempo. Mohon segera dibayar.`,
    at: new Date().toISOString(),
  })
}

// Per-subscriber data usage for the period (mock; real backend reads RADIUS
// accounting). Quota derives from plan speed; FUP triggers over quota.
const USAGE_FIXTURES = CUSTOMER_FIXTURES.filter(
  (c) => c.status === 'aktif' || c.status === 'isolir',
).map((c, i) => {
  const plan = PLAN_FIXTURES.find((p) => p.name === c.planName)
  const speed = plan?.speedMbps ?? 20
  const quotaGb = speed >= 100 ? 0 : speed >= 50 ? 1000 : 500
  const usedGb = quotaGb === 0 ? 300 + i * 40 : Math.round(quotaGb * (0.4 + (i % 7) * 0.12))
  return {
    customerId: c.id,
    customerName: c.fullName,
    planName: c.planName,
    quotaGb,
    usedGb,
    fupThrottled: quotaGb > 0 && usedGb >= quotaGb,
    trend: Array.from({ length: 7 }, (_, d) => 5 + ((i + d) % 9) * 3),
  }
})

// NOC telemetry derived from device fixtures (mock; real backend polls SNMP).
const MONITORING_METRIC_FIXTURES = DEVICE_FIXTURES.map((d, i) => {
  const status = d.status === 'offline' ? 'down' : d.status === 'degraded' ? 'degraded' : 'up'
  return {
    deviceId: d.id,
    name: d.name,
    type: d.type,
    areaName: d.areaName,
    status: status as 'up' | 'degraded' | 'down',
    uptimePct:
      status === 'down'
        ? 0
        : status === 'degraded'
          ? 97.5
          : Math.round((99.9 - (i % 5) * 0.1) * 10) / 10,
    latencyMs: status === 'down' ? 0 : 5 + (i % 6) * 4 + (status === 'degraded' ? 60 : 0),
    utilizationPct: 30 + (i % 7) * 9,
  }
})
// Active alerts from any device not fully up.
const MONITORING_ALERT_FIXTURES = DEVICE_FIXTURES.filter((d) => d.status !== 'online').map(
  (d, i) => ({
    id: oid('a1e47000', i),
    deviceId: d.id,
    deviceName: d.name,
    severity: (d.status === 'offline' ? 'critical' : 'warning') as 'critical' | 'warning',
    message:
      d.status === 'offline'
        ? `${d.name} tidak merespons (down)`
        : `${d.name} mengalami degradasi / latensi tinggi`,
    at: iso(2026, 4, 25 - i),
    acknowledged: false,
  }),
)

// FTTH distribution points (ODP) — port capacity + optical health (mock).
const ODP_FIXTURES = Array.from({ length: 12 }, (_, i) => {
  const is16 = i % 3 === 0
  const totalPorts = is16 ? 16 : 8
  const usedPorts = Math.min(totalPorts, 2 + ((i * 5) % (totalPorts + 1)))
  const rx = -18 - (i % 11) // -18 .. -28 dBm
  const status = rx >= -25 ? 'healthy' : rx >= -27 ? 'warning' : 'critical'
  const area = AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara'
  return {
    id: oid('0d90d900', i),
    name: `ODP-${area.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    area,
    splitter: is16 ? '1:16' : '1:8',
    totalPorts,
    usedPorts,
    avgRxPowerDbm: rx,
    status: status as 'healthy' | 'warning' | 'critical',
  }
})

// TR-069 / GenieACS managed CPE, derived from GPON subscribers (mock).
const ACS_MODELS = ['ZTE F660', 'Huawei HG8245', 'Fiberhome AN5506'] as const
// Not `as const`: firmware is mutated by the bulk firmware task, keep it wide.
const ACS_FIRMWARES: string[] = ['v2.3.0', 'v2.4.1', 'v2.4.1']
const ACS_DEVICE_FIXTURES = CUSTOMER_FIXTURES.filter((c) => c.connection?.type === 'gpon').map(
  (c, i) => ({
    id: c.id,
    serial: c.connection?.onuSerial ?? `ZTEG${10_000_000 + i}`,
    customerName: c.fullName,
    model: ACS_MODELS[i % ACS_MODELS.length] ?? 'ZTE F660',
    firmware: ACS_FIRMWARES[i % ACS_FIRMWARES.length] ?? 'v2.4.1',
    rxPowerDbm: c.connection?.rxPower ?? null,
    status: (c.status === 'aktif' ? 'online' : 'offline') as 'online' | 'offline',
    lastInform: iso(2026, 5, 5),
  }),
)

// Subscription agreements (PKS). Seeded for half of the provisioned subscribers
// at varying lifecycle stages (signed / sent / draft).
const CONTRACT_FIXTURES = CUSTOMER_FIXTURES.filter(
  (c, i) => i % 2 === 0 && (c.status === 'aktif' || c.status === 'isolir'),
).map((c, i) => {
  const status = (['signed', 'sent', 'draft'] as const)[i % 3] ?? 'draft'
  return {
    id: `${c.id}-pks`,
    number: `PKS-2026-${String(1 + i).padStart(4, '0')}`,
    customerId: c.id,
    customerName: c.fullName,
    planName: c.planName,
    status: status as 'draft' | 'sent' | 'signed',
    meterai: status === 'signed',
    createdAt: iso(2025, i % 12, 1 + (i % 27)),
    signedAt: status === 'signed' ? iso(2025, i % 12, 5 + (i % 20)) : null,
  }
})

// Sales pipeline leads across stages (mock).
const LEAD_STAGES = ['new', 'survey', 'quote', 'won', 'lost'] as const
const LEAD_SOURCES = ['walk_in', 'referral', 'online', 'reseller'] as const
const LEAD_FIXTURES = Array.from({ length: 9 }, (_, i) => {
  const plan = PLAN_FIXTURES[i % PLAN_FIXTURES.length]
  const stage = LEAD_STAGES[i % LEAD_STAGES.length] ?? 'new'
  return {
    id: oid('1ead0000', i),
    name: `Calon ${String.fromCharCode(65 + i)}`,
    phone: `08${String(1200000000 + i * 7).slice(0, 10)}`,
    address: `Jl. Pahlawan No. ${i + 1}, Jepara`,
    areaName: AREA_NAMES[i % AREA_NAMES.length] ?? 'Jepara',
    planName: plan?.name ?? 'Home 20',
    stage: stage as 'new' | 'survey' | 'quote' | 'won' | 'lost',
    estValue: plan?.priceMonthly ?? 200_000,
    source: (LEAD_SOURCES[i % LEAD_SOURCES.length] ?? 'walk_in') as
      | 'walk_in'
      | 'referral'
      | 'online'
      | 'reseller',
    note: null as string | null,
    createdAt: iso(2026, 4, 1 + i),
  }
})

// SLA compensation credits, seeded from breached tickets (mock).
const SLA_CREDIT_FIXTURES = TICKET_FIXTURES.filter((t) => t.status === 'breached').map((t, i) => ({
  id: oid('51ac0000', i),
  customerId: (CUSTOMER_FIXTURES.find((c) => c.fullName === t.customerName)?.id ?? null) as
    | string
    | null,
  customerName: t.customerName,
  amount: 25_000 + i * 15_000,
  reason: `Kompensasi pelanggaran SLA tiket ${t.code}`,
  ticketId: t.id as string | null,
  ticketCode: t.code as string | null,
  status: (i === 0 ? 'applied' : 'pending') as 'pending' | 'applied' | 'void',
  createdAt: t.createdAt,
  appliedAt: (i === 0 ? iso(2026, 4, 20) : null) as string | null,
}))

// Branches / cabang (POPs) with per-branch rollups (mock).
const BRANCH_FIXTURES = [
  {
    id: oid('b4a0c000', 0),
    name: 'Kantor Pusat Jepara',
    city: 'Jepara',
    manager: 'Andi Wijaya',
    phone: '0291-591234',
    status: 'active' as 'active' | 'inactive',
    isHeadOffice: true,
    customerCount: 320,
    mrr: 96_000_000,
    deviceCount: 18,
  },
  {
    id: oid('b4a0c000', 1),
    name: 'Cabang Pecangaan',
    city: 'Pecangaan',
    manager: 'Budi Hartono',
    phone: '0291-755221',
    status: 'active' as 'active' | 'inactive',
    isHeadOffice: false,
    customerCount: 145,
    mrr: 41_000_000,
    deviceCount: 9,
  },
  {
    id: oid('b4a0c000', 2),
    name: 'Cabang Bangsri',
    city: 'Bangsri',
    manager: 'Citra Lestari',
    phone: '0291-771188',
    status: 'active' as 'active' | 'inactive',
    isHeadOffice: false,
    customerCount: 88,
    mrr: 23_500_000,
    deviceCount: 6,
  },
]

// Account security: current user's active sessions + 2FA flag (mock).
const SECURITY_SESSION_FIXTURES = [
  {
    id: oid('5e555510', 0),
    device: 'Chrome · macOS',
    ip: '103.12.34.56',
    lastActiveAt: iso(2026, 5, 6),
    current: true,
  },
  {
    id: oid('5e555510', 1),
    device: 'Safari · iOS',
    ip: '103.12.34.57',
    lastActiveAt: iso(2026, 5, 5),
    current: false,
  },
  {
    id: oid('5e555510', 2),
    device: 'Edge · Windows',
    ip: '180.250.1.2',
    lastActiveAt: iso(2026, 5, 4),
    current: false,
  },
]
const SECURITY_STATE = { twoFactorEnabled: false }

// ---------------------------------------------------------------------------
// Stateful store — collections persist to localStorage so CRUD survives a
// refresh (dev). Tests reset to the seed before each test (see test/setup.ts).
// ---------------------------------------------------------------------------
// Bump the version suffix whenever a fixture's shape changes so a stale
// localStorage snapshot from an older schema is ignored instead of failing
// Zod validation. v2: invoices gained `lastRemindedAt` (dunning). v3: invoices
// gained `taxAmount`/`taxInvoiceNo`, customers `npwp`, settings `tax`.
const DB_KEY = 'isp-cms-mock-db-v22'

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
  cables: CABLE_FIXTURES,
  strands: STRAND_FIXTURES,
  splitters: SPLITTER_FIXTURES,
  closures: CLOSURE_FIXTURES,
  splices: SPLICE_FIXTURES,
  circuits: CIRCUIT_FIXTURES,
  mikrotikProfiles: MIKROTIK_PROFILE_FIXTURES,
  mikrotikSecrets: MIKROTIK_SECRET_FIXTURES,
  mikrotikSessions: MIKROTIK_SESSION_FIXTURES,
  mikrotikQueues: MIKROTIK_QUEUE_FIXTURES,
  mikrotikPools: MIKROTIK_POOL_FIXTURES,
  ticketEvents: TICKET_EVENT_FIXTURES,
  vouchers: VOUCHER_FIXTURES,
  resellerLedger: RESELLER_LEDGER_FIXTURES,
  stockMovements: STOCK_MOVEMENT_FIXTURES,
  paymentIntents: PAYMENT_INTENT_FIXTURES,
  audit: AUDIT_FIXTURES,
  settings: [SETTINGS_FIXTURE],
  notificationTemplates: NOTIFICATION_TEMPLATE_FIXTURES,
  notificationLog: NOTIFICATION_LOG_FIXTURES,
  usage: USAGE_FIXTURES,
  monitoringMetrics: MONITORING_METRIC_FIXTURES,
  monitoringAlerts: MONITORING_ALERT_FIXTURES,
  odp: ODP_FIXTURES,
  acsDevices: ACS_DEVICE_FIXTURES,
  contracts: CONTRACT_FIXTURES,
  leads: LEAD_FIXTURES,
  slaCredits: SLA_CREDIT_FIXTURES,
  branches: BRANCH_FIXTURES,
  securitySessions: SECURITY_SESSION_FIXTURES,
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
  http.patch('*/api/users/:id', async ({ params, request }) => {
    const found = APP_USER_FIXTURES.find((u) => u.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      })
    }
    const body = UpdateUserSchema.parse(await request.json())
    if (body.fullName !== undefined) found.fullName = body.fullName
    if (body.role !== undefined) found.role = body.role
    recordAudit('user.update', 'Staf', `Memperbarui staf ${found.fullName}`, 'Admin', found.id)
    persistDb()
    return HttpResponse.json(found)
  }),

  // Plans
  http.get('*/api/plans', () => {
    // Attach a live subscriber count per plan from the customer base.
    const items = PLAN_FIXTURES.map((p) => ({
      ...p,
      subscriberCount: CUSTOMER_FIXTURES.filter((c) => c.planName === p.name).length,
    }))
    return HttpResponse.json({ items, total: items.length })
  }),
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
    setTopoCustomerLifecycle(found.fullName, 'berhenti')
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
    setTopoCustomerLifecycle(found.fullName, 'isolir')
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
    setTopoCustomerLifecycle(found.fullName, 'aktif')
    setSecretsDisabledByCustomer(found.fullName, false)
    persistDb()
    return HttpResponse.json(found)
  }),
  // UU PDP: record consent to data processing.
  http.post('*/api/customers/:id/consent', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    found.consentAt = new Date().toISOString()
    recordAudit('customer.consent', 'Pelanggan', `Persetujuan PDP ${found.fullName}`)
    persistDb()
    return HttpResponse.json(found)
  }),
  // KYC capture (NIK/KTP, NPWP).
  http.patch('*/api/customers/:id/kyc', async ({ params, request }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as { ktp: string; npwp?: string }
    found.ktp = body.ktp
    if (body.npwp !== undefined) found.npwp = body.npwp === '' ? null : body.npwp
    persistDb()
    return HttpResponse.json(found)
  }),
  // Data-subject erasure request (logged; historical billing retained).
  http.post('*/api/customers/:id/data-deletion', ({ params }) => {
    const found = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    recordAudit('customer.data_deletion', 'Pelanggan', `Permintaan hapus data ${found.fullName}`)
    persistDb()
    return new HttpResponse(null, { status: 202 })
  }),
  // Subscription contract (PKS): draft → sent → signed (+ e-Meterai).
  http.get('*/api/customers/:id/contract', ({ params }) => {
    const contract = CONTRACT_FIXTURES.find((k) => k.customerId === params.id) ?? null
    return HttpResponse.json({ contract })
  }),
  http.post('*/api/customers/:id/contract', ({ params }) => {
    const existing = CONTRACT_FIXTURES.find((k) => k.customerId === params.id)
    if (existing) return HttpResponse.json(existing, { status: 200 })
    const customer = CUSTOMER_FIXTURES.find((c) => c.id === params.id)
    if (!customer) return new HttpResponse(null, { status: 404 })
    const contract = {
      id: crypto.randomUUID(),
      number: `PKS-2026-${String(1000 + CONTRACT_FIXTURES.length).slice(0, 4)}`,
      customerId: customer.id,
      customerName: customer.fullName,
      planName: customer.planName,
      status: 'draft' as 'draft' | 'sent' | 'signed',
      meterai: false,
      createdAt: new Date().toISOString(),
      signedAt: null as string | null,
    }
    CONTRACT_FIXTURES.push(contract)
    recordAudit('contract.create', 'Kontrak', `PKS dibuat ${customer.fullName}`)
    persistDb()
    return HttpResponse.json(contract, { status: 201 })
  }),
  http.post('*/api/customers/:id/contract/send', ({ params }) => {
    const found = CONTRACT_FIXTURES.find((k) => k.customerId === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.status = 'sent'
    persistDb()
    return HttpResponse.json(found)
  }),
  http.post('*/api/customers/:id/contract/sign', ({ params }) => {
    const found = CONTRACT_FIXTURES.find((k) => k.customerId === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.status = 'signed'
    found.meterai = true
    found.signedAt = new Date().toISOString()
    recordAudit('contract.sign', 'Kontrak', `PKS ditandatangani ${found.customerName}`)
    persistDb()
    return HttpResponse.json(found)
  }),

  // CRM / sales pipeline
  http.get('*/api/leads', () =>
    HttpResponse.json({ items: LEAD_FIXTURES, total: LEAD_FIXTURES.length }),
  ),
  http.post('*/api/leads', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      phone: string
      address: string
      areaName: string
      planName: string
      estValue: number
      source: 'walk_in' | 'referral' | 'online' | 'reseller'
      note?: string
    }
    const lead = {
      id: crypto.randomUUID(),
      name: body.name,
      phone: body.phone,
      address: body.address,
      areaName: body.areaName,
      planName: body.planName,
      stage: 'new' as 'new' | 'survey' | 'quote' | 'won' | 'lost',
      estValue: body.estValue,
      source: body.source,
      note: body.note ? body.note : null,
      createdAt: new Date().toISOString(),
    }
    LEAD_FIXTURES.unshift(lead)
    persistDb()
    return HttpResponse.json(lead, { status: 201 })
  }),
  http.patch('*/api/leads/:id/stage', async ({ params, request }) => {
    const found = LEAD_FIXTURES.find((l) => l.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as {
      stage: 'new' | 'survey' | 'quote' | 'won' | 'lost'
    }
    found.stage = body.stage
    persistDb()
    return HttpResponse.json(found)
  }),
  // Convert a won lead into a subscriber (status "instalasi") + mark won.
  http.post('*/api/leads/:id/convert', ({ params }) => {
    const found = LEAD_FIXTURES.find((l) => l.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    const plan = PLAN_FIXTURES.find((p) => p.name === found.planName) ?? PLAN_FIXTURES[0]
    CUSTOMER_FIXTURES.unshift({
      id: crypto.randomUUID(),
      customerNo: `CUST-${9000 + CUSTOMER_FIXTURES.length}`,
      fullName: found.name,
      phone: found.phone,
      email: null,
      address: found.address,
      areaId: oid('dddddddd', 0),
      areaName: found.areaName,
      planId: plan?.id ?? oid('bbbbbbbb', 1),
      planName: plan?.name ?? 'Home 20',
      status: 'instalasi' as const,
      outstanding: 0,
      npwp: null,
      ktp: null,
      consentAt: null,
      resellerName: null,
      connection: null,
      joinedAt: new Date().toISOString(),
    })
    // Converting a won lead kicks off onboarding: schedule an install WO
    // (mirrors POST /onboarding) so the field flow isn't orphaned.
    WORKORDER_FIXTURES.unshift({
      id: crypto.randomUUID(),
      code: `WO-${9000 + WORKORDER_FIXTURES.length}`,
      type: 'install' as const,
      customerId: null, // lead becomes a subscriber only at onboarding
      customerName: found.name,
      technician: null,
      scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    })
    found.stage = 'won'
    recordAudit('lead.convert', 'Prospek', `Konversi prospek ${found.name}`)
    persistDb()
    return HttpResponse.json(found)
  }),

  // SLA compensation credits
  http.get('*/api/sla-credits', () => {
    const items = [...SLA_CREDIT_FIXTURES].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/sla-credits', async ({ request }) => {
    const body = (await request.json()) as {
      customerName: string
      amount: number
      reason: string
      ticketCode?: string
    }
    const ticket = body.ticketCode
      ? TICKET_FIXTURES.find((t) => t.code === body.ticketCode)
      : undefined
    const credit = {
      id: crypto.randomUUID(),
      customerId: (CUSTOMER_FIXTURES.find((c) => c.fullName === body.customerName)?.id ?? null) as
        | string
        | null,
      customerName: body.customerName,
      amount: body.amount,
      reason: body.reason,
      ticketId: (ticket?.id ?? null) as string | null,
      ticketCode: body.ticketCode ? body.ticketCode : null,
      status: 'pending' as 'pending' | 'applied' | 'void',
      createdAt: new Date().toISOString(),
      appliedAt: null as string | null,
    }
    SLA_CREDIT_FIXTURES.unshift(credit)
    recordAudit('sla_credit.create', 'Kredit SLA', `Kredit SLA ${body.customerName}`)
    persistDb()
    return HttpResponse.json(credit, { status: 201 })
  }),
  http.post('*/api/sla-credits/:id/apply', ({ params }) => {
    const found = SLA_CREDIT_FIXTURES.find((c) => c.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.status = 'applied'
    found.appliedAt = new Date().toISOString()
    recordAudit('sla_credit.apply', 'Kredit SLA', `Kredit diterapkan ${found.customerName}`)
    persistDb()
    return HttpResponse.json(found)
  }),
  http.post('*/api/sla-credits/:id/void', ({ params }) => {
    const found = SLA_CREDIT_FIXTURES.find((c) => c.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.status = 'void'
    persistDb()
    return HttpResponse.json(found)
  }),

  // Branches / cabang
  http.get('*/api/branches', () =>
    HttpResponse.json({
      items: BRANCH_FIXTURES,
      total: BRANCH_FIXTURES.length,
    }),
  ),
  http.post('*/api/branches', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      city: string
      manager: string
      phone: string
    }
    const branch = {
      id: crypto.randomUUID(),
      name: body.name,
      city: body.city,
      manager: body.manager,
      phone: body.phone,
      status: 'active' as 'active' | 'inactive',
      isHeadOffice: false,
      customerCount: 0,
      mrr: 0,
      deviceCount: 0,
    }
    BRANCH_FIXTURES.push(branch)
    recordAudit('branch.create', 'Cabang', `Cabang baru ${body.name}`)
    persistDb()
    return HttpResponse.json(branch, { status: 201 })
  }),
  http.patch('*/api/branches/:id', async ({ params, request }) => {
    const found = BRANCH_FIXTURES.find((b) => b.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Cabang tidak ditemukan' }), {
        status: 404,
      })
    }
    const body = UpdateBranchSchema.parse(await request.json())
    if (body.name !== undefined) found.name = body.name
    if (body.city !== undefined) found.city = body.city
    if (body.manager !== undefined) found.manager = body.manager
    if (body.phone !== undefined) found.phone = body.phone
    if (body.status !== undefined) found.status = body.status
    recordAudit('branch.update', 'Cabang', `Memperbarui cabang ${found.name}`, 'Admin', found.id)
    persistDb()
    return HttpResponse.json(found)
  }),

  // Account security: 2FA + active sessions
  http.get('*/api/security', () =>
    HttpResponse.json({
      twoFactorEnabled: SECURITY_STATE.twoFactorEnabled,
      sessions: SECURITY_SESSION_FIXTURES,
    }),
  ),
  http.post('*/api/security/2fa/enable', () => {
    SECURITY_STATE.twoFactorEnabled = true
    recordAudit('security.2fa_enable', 'Keamanan', '2FA diaktifkan')
    persistDb()
    return HttpResponse.json({
      twoFactorEnabled: true,
      sessions: SECURITY_SESSION_FIXTURES,
    })
  }),
  http.post('*/api/security/2fa/disable', () => {
    SECURITY_STATE.twoFactorEnabled = false
    recordAudit('security.2fa_disable', 'Keamanan', '2FA dinonaktifkan')
    persistDb()
    return HttpResponse.json({
      twoFactorEnabled: false,
      sessions: SECURITY_SESSION_FIXTURES,
    })
  }),
  http.post('*/api/security/sessions/:id/revoke', ({ params }) => {
    const idx = SECURITY_SESSION_FIXTURES.findIndex((s) => s.id === params.id && !s.current)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    SECURITY_SESSION_FIXTURES.splice(idx, 1)
    recordAudit('security.session_revoke', 'Keamanan', 'Sesi diakhiri')
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('*/api/security/sessions/revoke-others', () => {
    const kept = SECURITY_SESSION_FIXTURES.filter((s) => s.current)
    SECURITY_SESSION_FIXTURES.length = 0
    SECURITY_SESSION_FIXTURES.push(...kept)
    recordAudit('security.session_revoke_all', 'Keamanan', 'Sesi lain diakhiri')
    persistDb()
    return new HttpResponse(null, { status: 204 })
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
      areaName: AREA_NAMES[0] ?? 'Jepara',
      planId: plan?.id ?? oid('bbbbbbbb', 1),
      planName: plan?.name ?? 'Home 20',
      status: 'prospek' as const,
      outstanding: 0,
      npwp: null,
      ktp: null,
      consentAt: null,
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
      lat?: number
      lng?: number
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
      areaName: body.areaName || (AREA_NAMES[0] ?? 'Jepara'),
      planId: plan?.id ?? oid('bbbbbbbb', 1),
      planName: plan?.name ?? 'Home 20',
      status: 'instalasi' as const,
      outstanding: 0,
      npwp: null,
      ktp: null,
      consentAt: null,
      resellerName: null,
      connection: null,
      joinedAt: new Date().toISOString(),
    }
    CUSTOMER_FIXTURES.unshift(customer)
    WORKORDER_FIXTURES.unshift({
      id: crypto.randomUUID(),
      code: `WO-${9000 + WORKORDER_FIXTURES.length}`,
      type: 'install' as const,
      customerId: customer.id,
      customerName: customer.fullName,
      technician: body.technician,
      scheduledAt: new Date(body.scheduledAt).toISOString(),
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    })
    // Drop the new subscriber onto the topology map under an ODP that still has
    // a free splitter port, at the picked coordinates. allocateDrop creates the
    // drop cable + strand + circuit and binds the splitter port (the single
    // capacity path); projected node.meta.portsUsed/coreNo follow from it.
    const odp = TOPOLOGY_FIXTURES.find(
      (n) =>
        n.type === 'odp' &&
        SPLITTER_FIXTURES.some(
          (s) => s.nodeId === n.id && s.ports.some((p) => p.outNodeId === null),
        ),
    )
    const lat = body.lat ?? (odp ? odp.lat + (Math.random() - 0.5) * 0.004 : -6.5514)
    const lng = body.lng ?? (odp ? odp.lng + (Math.random() - 0.5) * 0.004 : 110.6811)
    const nodeId = `${customer.id}-node`
    const drop = odp
      ? allocateDrop(
          CABLING_STORE,
          TOPOLOGY_FIXTURES,
          odp,
          { id: nodeId, lat, lng, customerId: customer.id },
          {}, // new install: no ONU/PON yet (connection provisioned later)
        )
      : null
    TOPOLOGY_FIXTURES.push({
      id: nodeId,
      name: customer.fullName,
      type: 'customer' as const,
      status: 'unknown' as const,
      lat,
      lng,
      parentId: odp ? odp.id : null,
      meta: {
        customerId: customer.id,
        planName: customer.planName,
        ...(drop ? { coreNo: drop.coreNo } : {}),
      },
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
    setTopoCustomerLifecycle(found.fullName, 'isolir')
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
    setTopoCustomerLifecycle(found.fullName, 'aktif')
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
      invoiceId: found.id,
      invoiceNo: found.invoiceNo,
      customerId: found.customerId,
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
        setTopoCustomerLifecycle(customer.fullName, 'aktif')
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
      logReminder(inv)
      reminded++
    }
    persistDb()
    return HttpResponse.json({ reminded, channel: 'whatsapp' })
  }),
  // Automated cycle — preview the next run without mutating anything.
  http.get('*/api/billing/scheduler/preview', () => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const periodStart = `${period}-01`
    const today = now.toISOString().slice(0, 10)
    const soon = new Date(now.getTime() + 3 * 86_400_000).toISOString().slice(0, 10)
    const graceCut = new Date(now.getTime() - SETTINGS_FIXTURE.billing.isolirGraceDays * 86_400_000)
      .toISOString()
      .slice(0, 10)

    let toBill = 0
    for (const c of CUSTOMER_FIXTURES) {
      if (c.status !== 'aktif') continue
      const exists = INVOICE_FIXTURES.some(
        (inv) => inv.customerId === c.id && inv.periodStart === periodStart,
      )
      if (!exists) toBill++
    }
    let toRemindUpcoming = 0
    let toRemindOverdue = 0
    const pastGrace = new Set<string>()
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'overdue') {
        toRemindOverdue++
        if (inv.dueDate < graceCut) pastGrace.add(inv.customerId)
      } else if (inv.status === 'pending') {
        if (inv.dueDate < today) {
          toRemindOverdue++
          if (inv.dueDate < graceCut) pastGrace.add(inv.customerId)
        } else if (inv.dueDate <= soon) {
          toRemindUpcoming++
        }
      }
    }
    let toIsolir = 0
    for (const c of CUSTOMER_FIXTURES) {
      if (c.status === 'aktif' && pastGrace.has(c.id)) toIsolir++
    }
    return HttpResponse.json({
      toBill,
      toRemindUpcoming,
      toRemindOverdue,
      toIsolir,
    })
  }),
  // Automated cycle — bill → mark overdue → remind → isolir, in one pass.
  http.post('*/api/billing/scheduler/run', () => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const periodStart = `${period}-01`
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    const dueDate = new Date(now.getTime() + SETTINGS_FIXTURE.billing.dueDays * 86_400_000)
      .toISOString()
      .slice(0, 10)
    const today = now.toISOString().slice(0, 10)
    const soon = new Date(now.getTime() + 3 * 86_400_000).toISOString().slice(0, 10)
    const graceCut = new Date(now.getTime() - SETTINGS_FIXTURE.billing.isolirGraceDays * 86_400_000)
      .toISOString()
      .slice(0, 10)
    const nowIso = now.toISOString()

    // 1. Create current-period invoices for active subscribers not yet billed.
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

    // 2. Flag past-due pending invoices as overdue (+denda).
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'pending' && inv.dueDate < today) {
        inv.status = 'overdue'
        if (inv.lateFee === 0) inv.lateFee = SETTINGS_FIXTURE.billing.lateFeeIdr
      }
    }

    // 3. Dunning: remind upcoming (≤3d) and overdue invoices.
    let remindedUpcoming = 0
    let remindedOverdue = 0
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'overdue') {
        inv.lastRemindedAt = nowIso
        logReminder(inv)
        remindedOverdue++
      } else if (inv.status === 'pending' && inv.dueDate <= soon) {
        inv.lastRemindedAt = nowIso
        logReminder(inv)
        remindedUpcoming++
      }
    }

    // 4. Auto-isolir: customers with an overdue invoice past the grace period.
    const owed = new Map<string, number>()
    const pastGrace = new Set<string>()
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status === 'overdue') {
        owed.set(
          inv.customerId,
          (owed.get(inv.customerId) ?? 0) + inv.amount + inv.lateFee + inv.taxAmount,
        )
        if (inv.dueDate < graceCut) pastGrace.add(inv.customerId)
      }
    }
    let isolated = 0
    for (const c of CUSTOMER_FIXTURES) {
      if (c.status === 'aktif' && pastGrace.has(c.id)) {
        c.status = 'isolir'
        c.outstanding = owed.get(c.id) ?? c.outstanding
        setSecretsDisabledByCustomer(c.fullName, true)
        isolated++
      }
    }

    recordAudit(
      'billing.scheduler',
      'Tagihan',
      `Siklus ${period}: ${created} tagihan, ${remindedUpcoming + remindedOverdue} pengingat, ${isolated} isolir`,
    )
    persistDb()
    return HttpResponse.json({
      period,
      created,
      remindedUpcoming,
      remindedOverdue,
      isolated,
    })
  }),

  // Payments
  http.get('*/api/payments', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json(
      applyListQuery(PAYMENT_FIXTURES, url.searchParams, {
        searchFields: ['invoiceNo', 'customerName'],
        sortAccessors: {
          paidAt: (p) => p.paidAt,
          invoiceNo: (p) => p.invoiceNo,
          amount: (p) => p.amount,
          customerName: (p) => p.customerName,
        },
        // Mirrors the BE default ORDER BY `paidAt desc`.
        defaultCompare: (a, b) => (a.paidAt < b.paidAt ? 1 : a.paidAt > b.paidAt ? -1 : 0),
      }),
    )
  }),
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
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        customerId: invoice.customerId,
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
          setTopoCustomerLifecycle(customer.fullName, 'aktif')
          setSecretsDisabledByCustomer(customer.fullName, false)
        }
      }
      recordAudit('payment.gateway', 'Tagihan', `Pembayaran ${intent.channel} ${invoice.invoiceNo}`)
    }
    persistDb()
    return HttpResponse.json(intent)
  }),

  // Devices
  http.get('*/api/devices', ({ request }) => {
    const url = new URL(request.url)
    // Equality filters first (type, status), then the shared search/sort/page
    // engine mirrors the backend list contract.
    let rows = DEVICE_FIXTURES
    const type = url.searchParams.get('type')
    if (type) rows = rows.filter((d) => d.type === type)
    rows = filterByStatus(rows, url.searchParams.get('status'))
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['name', 'ipAddress', 'areaName'],
        sortAccessors: {
          name: (d) => d.name,
          status: (d) => d.status,
          rxPower: (d) => d.rxPower,
          uptimeHours: (d) => d.uptimeHours,
          lastSeenAt: (d) => d.lastSeenAt,
        },
        defaultCompare: (a, b) => a.name.localeCompare(b.name),
      }),
    )
  }),
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
  // Probe a RouterOS device (API) → identity / board-name / version. Fails
  // auth when the password is empty (to exercise the error path).
  http.post('*/api/routers/test-connection', async ({ request }) => {
    const body = (await request.json()) as { host: string; password: string }
    if (!body.password) {
      return HttpResponse.json({
        ok: false,
        identity: null,
        model: null,
        version: null,
        message: 'Autentikasi gagal — periksa username / password.',
      })
    }
    const idx = [...body.host].reduce((a, c) => a + c.charCodeAt(0), 0) % ROUTER_MODELS.length
    return HttpResponse.json({
      ok: true,
      identity: `MikroTik-${body.host}`,
      model: ROUTER_MODELS[idx] ?? 'RB5009',
      version: ROUTER_VERSIONS[idx % ROUTER_VERSIONS.length] ?? '7.15.3',
      message: null,
    })
  }),
  // Connect (save) a new router after a successful probe.
  http.post('*/api/routers', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      host: string
      apiPort: number
      username: string
    }
    const idx = [...body.host].reduce((a, c) => a + c.charCodeAt(0), 0) % ROUTER_MODELS.length
    const router = {
      id: crypto.randomUUID(),
      name: body.name,
      address: body.host,
      apiPort: body.apiPort,
      username: body.username,
      model: ROUTER_MODELS[idx] ?? 'RB5009',
      version: ROUTER_VERSIONS[idx % ROUTER_VERSIONS.length] ?? '7.15.3',
      status: 'online' as const,
      secretCount: 0,
      lastSyncAt: new Date().toISOString(),
    }
    ROUTER_FIXTURES.unshift(router)
    recordAudit('router.connect', 'Router', `Router terhubung ${body.name}`)
    persistDb()
    return HttpResponse.json(router, { status: 201 })
  }),
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
      customerId: body.customerName
        ? (CUSTOMER_FIXTURES.find((c) => c.fullName === body.customerName)?.id ?? null)
        : null,
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
  // IP pools (provisioning)
  http.get('*/api/routers/:id/pools', ({ params }) => {
    const items = MIKROTIK_POOL_FIXTURES.filter((p) => p.routerId === params.id)
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/routers/:id/pools', async ({ params, request }) => {
    const body = (await request.json()) as { name: string; ranges: string }
    const pool = {
      id: crypto.randomUUID(),
      routerId: String(params.id),
      name: body.name,
      ranges: body.ranges,
      totalAddresses: 253,
      usedAddresses: 0,
    }
    MIKROTIK_POOL_FIXTURES.push(pool)
    persistDb()
    return HttpResponse.json(pool, { status: 201 })
  }),
  http.delete('*/api/routers/:id/pools/:pid', ({ params }) => {
    const idx = MIKROTIK_POOL_FIXTURES.findIndex((p) => p.id === params.pid)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    MIKROTIK_POOL_FIXTURES.splice(idx, 1)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  // Work orders
  http.get('*/api/work-orders', ({ request }) => {
    const url = new URL(request.url)
    // Equality filters first (status, type), then the shared search/sort/page
    // engine mirrors the backend list contract.
    let rows = filterByStatus(WORKORDER_FIXTURES, url.searchParams.get('status'))
    const type = url.searchParams.get('type')
    if (type) rows = rows.filter((w) => w.type === type)
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['code', 'customerName', 'technician'],
        sortAccessors: {
          code: (w) => w.code,
          scheduledAt: (w) => w.scheduledAt,
          status: (w) => w.status,
          createdAt: (w) => w.createdAt,
        },
        defaultCompare: (a, b) => b.createdAt.localeCompare(a.createdAt),
      }),
    )
  }),
  // Complete a WO; an install also activates + provisions + invoices the customer.
  http.post('*/api/work-orders/:id/complete', ({ params }) => {
    const wo = WORKORDER_FIXTURES.find((w) => w.id === params.id)
    if (!wo) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    // Idempotent: a WO already done doesn't re-provision (no duplicate ONU /
    // secret / invoice on a double-click or repeat call).
    if (wo.status === 'done') {
      return HttpResponse.json(wo)
    }
    wo.status = 'done'
    if (wo.type === 'install') {
      const customer = CUSTOMER_FIXTURES.find((c) => c.fullName === wo.customerName)
      // Only provision a customer that isn't active yet.
      if (customer && customer.status !== 'aktif') {
        const seq = CUSTOMER_FIXTURES.indexOf(customer)
        customer.status = 'aktif'
        setTopoCustomerLifecycle(customer.fullName, 'aktif')
        // Consume an ONU from the warehouse: assign it to the customer + log
        // the stock movement, so inventory reflects the install. Falls back to
        // a synthetic serial if no ONU is in stock.
        const onu = INVENTORY_FIXTURES.find((it) => it.kind === 'onu' && it.status === 'warehouse')
        let onuSerial = `ZTEG${String(20000000 + seq)}`
        if (onu) {
          onu.status = 'installed'
          onu.assignedTo = customer.fullName
          onu.assignedCustomerId = customer.id
          onuSerial = onu.serial
          STOCK_MOVEMENT_FIXTURES.unshift({
            id: crypto.randomUUID(),
            itemId: onu.id,
            serial: onu.serial,
            kind: onu.kind,
            type: 'assign',
            note: customer.fullName,
            at: new Date().toISOString(),
          })
        }
        const pppoeUsername = customer.customerNo.toLowerCase().replace('-', '')
        customer.connection = {
          type: 'gpon',
          pppoeUsername,
          profile: customer.planName,
          ipAddress: `100.64.${100 + (seq % 150)}.2`,
          onuSerial,
          olt: 'OLT-1',
          ponPort: `0/${seq % 8}/${seq % 16}`,
          rxPower: -20 - (seq % 6),
        }
        // Provision a PPPoE secret on a Mikrotik so the new subscriber shows up
        // on the router (Secrets tab) — closes the connect-router → customer loop.
        const router = ROUTER_FIXTURES[0]
        if (router) {
          const profile = MIKROTIK_PROFILE_FIXTURES.find(
            (p) => p.routerId === router.id && p.name === customer.planName,
          )
          MIKROTIK_SECRET_FIXTURES.unshift({
            id: crypto.randomUUID(),
            routerId: router.id,
            username: pppoeUsername,
            profileId: profile?.id ?? `${router.id}-prof-home20`,
            profileName: profile?.name ?? customer.planName,
            customerId: customer.id,
            customerName: customer.fullName,
            disabled: false,
            comment: `Auto-provision saat instalasi (${wo.code})`,
          })
          router.secretCount += 1
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
  http.get('*/api/resellers', ({ request }) => {
    const url = new URL(request.url)
    const rows = filterByStatus(RESELLER_FIXTURES, url.searchParams.get('status'))
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['name', 'area'],
        sortAccessors: {
          name: (r) => r.name,
          area: (r) => r.area,
          balance: (r) => r.balance,
          commissionPct: (r) => r.commissionPct,
          status: (r) => r.status,
        },
        // Preserve the seed order (mirrors the BE default `createdAt desc`); the
        // fixture has no createdAt, so a stable no-op keeps insertion order.
        defaultCompare: () => 0,
      }),
    )
  }),
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
    const url = new URL(request.url)
    const rows = filterByStatus(INVENTORY_FIXTURES, url.searchParams.get('status'))
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['serial', 'assignedTo'],
        sortAccessors: {
          serial: (i) => i.serial,
          status: (i) => i.status,
          kind: (i) => i.kind,
        },
        // Preserve the seed order (mirrors the BE default `createdAt desc`); the
        // fixture has no createdAt, so a stable no-op keeps insertion order.
        defaultCompare: () => 0,
      }),
    )
  }),
  // Full stock movement history (default newest first).
  http.get('*/api/inventory/movements', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json(
      applyListQuery(STOCK_MOVEMENT_FIXTURES, url.searchParams, {
        searchFields: ['serial', 'note'],
        sortAccessors: {
          at: (m) => m.at,
          serial: (m) => m.serial,
          type: (m) => m.type,
          kind: (m) => m.kind,
        },
        // Newest first by default (mirrors the BE default `at desc`).
        defaultCompare: (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0),
      }),
    )
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
      assignedCustomerId: null,
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
      found.assignedCustomerId =
        CUSTOMER_FIXTURES.find((c) => c.fullName === found.assignedTo)?.id ?? null
      note = found.assignedTo ?? ''
    } else if (body.type === 'return') {
      found.status = 'warehouse'
      found.assignedTo = null
      found.assignedCustomerId = null
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
    if (body.assignedTo !== undefined) {
      found.assignedTo = body.assignedTo
      found.assignedCustomerId = body.assignedTo
        ? (CUSTOMER_FIXTURES.find((c) => c.fullName === body.assignedTo)?.id ?? null)
        : null
    }
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
    const url = new URL(request.url)
    // Equality filter first (status), then the shared search/sort/page engine
    // mirrors the backend list contract.
    const rows = filterByStatus(TICKET_FIXTURES, url.searchParams.get('status'))
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['code', 'subject', 'customerName'],
        sortAccessors: {
          code: (t) => t.code,
          status: (t) => t.status,
          priority: (t) => t.priority,
          slaDueAt: (t) => t.slaDueAt,
          createdAt: (t) => t.createdAt,
        },
        defaultCompare: (a, b) => b.createdAt.localeCompare(a.createdAt),
      }),
    )
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
      customerId: CUSTOMER_FIXTURES.find((c) => c.fullName === body.customerName)?.id ?? null,
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
      customerId: CUSTOMER_FIXTURES.find((c) => c.fullName === ticket.customerName)?.id ?? null,
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
  http.get('*/api/coverage', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json(
      applyListQuery(COVERAGE_FIXTURES, url.searchParams, {
        searchFields: ['name', 'region'],
        sortAccessors: {
          name: (c) => c.name,
          region: (c) => c.region,
          status: (c) => c.status,
          capacity: (c) => c.capacity,
          activeConnections: (c) => c.activeConnections,
          type: (c) => c.type,
        },
        // Default mirrors the backend ORDER BY name ASC.
        defaultCompare: (a, b) => a.name.localeCompare(b.name),
      }),
    )
  }),

  // Usage / quota / FUP
  http.get('*/api/usage', () =>
    HttpResponse.json({
      items: USAGE_FIXTURES,
      total: USAGE_FIXTURES.length,
    }),
  ),

  // NOC monitoring
  http.get('*/api/monitoring/metrics', () =>
    HttpResponse.json({
      items: MONITORING_METRIC_FIXTURES,
      total: MONITORING_METRIC_FIXTURES.length,
    }),
  ),
  http.get('*/api/monitoring/alerts', () => {
    const items = [...MONITORING_ALERT_FIXTURES].sort((a, b) => (a.at < b.at ? 1 : -1))
    return HttpResponse.json({ items, total: items.length })
  }),
  http.post('*/api/monitoring/alerts/:id/acknowledge', ({ params }) => {
    const found = MONITORING_ALERT_FIXTURES.find((a) => a.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    found.acknowledged = true
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  // Auto-ticket: escalate an alert into a repair work item + acknowledge it.
  http.post('*/api/monitoring/alerts/:id/ticket', ({ params }) => {
    const found = MONITORING_ALERT_FIXTURES.find((a) => a.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    const now = Date.now()
    const slaHours = SLA_HOURS.high ?? 8
    const ticket = {
      id: crypto.randomUUID(),
      code: `TKT-${9000 + TICKET_FIXTURES.length}`,
      subject: `[NOC] ${found.message}`,
      customerId: null, // device alert, not a subscriber
      customerName: found.deviceName,
      priority: 'high' as const,
      status: 'open' as const,
      assignee: null,
      slaDueAt: new Date(now + slaHours * 3_600_000).toISOString(),
      createdAt: new Date(now).toISOString(),
    }
    TICKET_FIXTURES.unshift(ticket)
    found.acknowledged = true
    recordAudit('monitoring.ticket', 'Tiket', `Auto-tiket dari alert ${found.deviceName}`)
    persistDb()
    return HttpResponse.json(ticket, { status: 201 })
  }),

  // FTTH / ODP capacity
  http.get('*/api/odp', () =>
    HttpResponse.json({ items: ODP_FIXTURES, total: ODP_FIXTURES.length }),
  ),

  // TR-069 / GenieACS
  http.get('*/api/acs/devices', () =>
    HttpResponse.json({
      items: ACS_DEVICE_FIXTURES,
      total: ACS_DEVICE_FIXTURES.length,
    }),
  ),
  // Bulk task: firmware upgrades flip the firmware version; reboot/wifi just ack.
  http.post('*/api/acs/bulk', async ({ request }) => {
    const body = (await request.json()) as {
      action: 'reboot' | 'firmware' | 'wifi'
      deviceIds: string[]
      firmwareVersion?: string
    }
    const ids = new Set(body.deviceIds)
    let affected = 0
    for (const d of ACS_DEVICE_FIXTURES) {
      if (!ids.has(d.id)) continue
      if (body.action === 'firmware' && body.firmwareVersion) {
        d.firmware = body.firmwareVersion
      }
      affected++
    }
    recordAudit(`acs.${body.action}`, 'ONU', `Bulk ${body.action} ke ${affected} CPE`)
    persistDb()
    return HttpResponse.json({ affected })
  }),

  // Analytics
  http.get('*/api/analytics/dashboard', () => {
    // Cross-module rollup computed at request time (fixtures defined below the
    // static summary), so the dashboard "command center" stays in one query.
    const activeLeads = LEAD_FIXTURES.filter((l) => ['new', 'survey', 'quote'].includes(l.stage))
    const atRisk = CUSTOMER_FIXTURES.filter(
      (c) => c.status === 'isolir' || c.outstanding > 0,
    ).length
    const commandCenter = {
      pipelineValue: activeLeads.reduce((s, l) => s + l.estValue, 0),
      activeLeads: activeLeads.length,
      churnRate: CUSTOMER_FIXTURES.length
        ? Math.round((atRisk / CUSTOMER_FIXTURES.length) * 1000) / 1000
        : 0,
      slaCreditsPending: SLA_CREDIT_FIXTURES.filter((c) => c.status === 'pending').length,
      devicesAlert: MONITORING_ALERT_FIXTURES.filter((a) => !a.acknowledged).length,
      odpFull: ODP_FIXTURES.filter((o) => o.usedPorts >= o.totalPorts).length,
    }

    // Subscriber lifecycle distribution.
    const mixOrder: Array<[string, string]> = [
      ['prospek', 'Prospek'],
      ['instalasi', 'Instalasi'],
      ['aktif', 'Aktif'],
      ['isolir', 'Isolir'],
      ['berhenti', 'Berhenti'],
    ]
    const customerMix = mixOrder.map(([status, label]) => ({
      label,
      count: CUSTOMER_FIXTURES.filter((c) => c.status === status).length,
    }))

    // Receivable aging from unpaid invoices, bucketed by days past due.
    const today = Date.now()
    const aging = { future: 0, b30: 0, b60: 0, b60plus: 0 }
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status !== 'pending' && inv.status !== 'overdue') continue
      const total = inv.amount + inv.lateFee + inv.taxAmount
      const days = Math.floor((today - new Date(inv.dueDate).getTime()) / 86_400_000)
      if (days <= 0) aging.future += total
      else if (days <= 30) aging.b30 += total
      else if (days <= 60) aging.b60 += total
      else aging.b60plus += total
    }
    const arAging = [
      { bucket: 'Belum jatuh tempo', amount: aging.future },
      { bucket: '1–30 hari', amount: aging.b30 },
      { bucket: '31–60 hari', amount: aging.b60 },
      { bucket: '> 60 hari', amount: aging.b60plus },
    ]

    return HttpResponse.json({
      ...DASHBOARD_SUMMARY,
      commandCenter,
      customerMix,
      arAging,
    })
  }),
  http.get('*/api/analytics/reports', () => HttpResponse.json(REPORTS_SUMMARY)),

  // Accounting: cash-basis GL journal for a period (derived from settled
  // invoices). Dr Kas, Cr Revenue + Denda + PPN Keluaran.
  http.get('*/api/accounting/journal', ({ request }) => {
    const period = new URL(request.url).searchParams.get('period') ?? ''
    const lines: Array<{
      id: string
      date: string
      accountCode: string
      accountName: string
      description: string
      debit: number
      credit: number
    }> = []
    let debit = 0
    let credit = 0
    for (const inv of INVOICE_FIXTURES) {
      if (inv.status !== 'paid' || !inv.paidAt || !inv.paidAt.startsWith(period)) {
        continue
      }
      const date = inv.paidAt
      const total = inv.amount + inv.lateFee + inv.taxAmount
      lines.push({
        id: `${inv.id}-dr`,
        date,
        accountCode: '1110',
        accountName: 'Kas & Bank',
        description: `Pelunasan ${inv.invoiceNo} - ${inv.customerName}`,
        debit: total,
        credit: 0,
      })
      lines.push({
        id: `${inv.id}-rev`,
        date,
        accountCode: '4100',
        accountName: 'Pendapatan Jasa Internet',
        description: `Pendapatan ${inv.invoiceNo}`,
        debit: 0,
        credit: inv.amount,
      })
      if (inv.lateFee > 0) {
        lines.push({
          id: `${inv.id}-fee`,
          date,
          accountCode: '4200',
          accountName: 'Pendapatan Denda',
          description: `Denda ${inv.invoiceNo}`,
          debit: 0,
          credit: inv.lateFee,
        })
      }
      if (inv.taxAmount > 0) {
        lines.push({
          id: `${inv.id}-tax`,
          date,
          accountCode: '2130',
          accountName: 'PPN Keluaran',
          description: `PPN ${inv.invoiceNo}`,
          debit: 0,
          credit: inv.taxAmount,
        })
      }
      debit += total
      credit += total
    }
    return HttpResponse.json({ period, lines, totals: { debit, credit } })
  }),

  // Customer experience: CSAT (post-ticket), NPS, churn risk (all derived).
  http.get('*/api/satisfaction', () => {
    const resolved = TICKET_FIXTURES.filter((t) => t.status === 'resolved')
    const ratings = resolved.map((_, i) => 3 + (i % 3)) // 3..5
    const csatAvg = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0

    const scores = CUSTOMER_FIXTURES.map((_, i) => (i * 7) % 11) // 0..10
    const promoters = scores.filter((s) => s >= 9).length
    const passives = scores.filter((s) => s >= 7 && s <= 8).length
    const detractors = scores.filter((s) => s <= 6).length
    const total = scores.length
    const npsScore = total ? Math.round((promoters / total) * 100 - (detractors / total) * 100) : 0

    const atRisk = CUSTOMER_FIXTURES.filter((c) => c.status === 'isolir' || c.outstanding > 0)
      .slice(0, 6)
      .map((c) => ({
        customerId: c.id,
        customerName: c.fullName,
        reason: c.status === 'isolir' ? 'Terisolir' : 'Tunggakan tagihan',
        riskPct: c.status === 'isolir' ? 80 : 55,
      }))
    const churnRate = CUSTOMER_FIXTURES.length
      ? Math.round((atRisk.length / CUSTOMER_FIXTURES.length) * 1000) / 10
      : 0

    const COMMENTS = [
      'Pemasangan cepat dan rapi',
      'Sinyal stabil, puas',
      'Sempat gangguan tapi cepat ditangani',
      'Pelayanan ramah',
      'Kurang puas saat isolir',
    ]
    const recentFeedback = resolved.slice(0, 6).map((t, i) => ({
      id: `${t.id}-fb`,
      customerId: CUSTOMER_FIXTURES.find((c) => c.fullName === t.customerName)?.id,
      customerName: t.customerName,
      rating: 3 + (i % 3),
      comment: COMMENTS[i % COMMENTS.length] ?? 'Terima kasih',
      at: t.createdAt,
    }))

    return HttpResponse.json({
      csat: { avg: csatAvg, count: ratings.length },
      nps: { score: npsScore, promoters, passives, detractors, total },
      churn: { rate: churnRate, atRisk },
      recentFeedback,
    })
  }),

  // Network topology
  http.get('*/api/topology', () => {
    // node.meta (splitter/ports/coreNo) is projected from the cabling layer; the
    // rest of meta passes through. A real backend computes this server-side.
    const items = projectNodeMeta(TOPOLOGY_FIXTURES, {
      splitters: SPLITTER_FIXTURES,
      strands: STRAND_FIXTURES,
    })
    return HttpResponse.json({ items, total: items.length })
  }),
  // "Pasang pelanggan": provision a subscriber's drop atomically — validate
  // first, then allocate the splitter port + drop cable + strand + circuit and
  // push the customer node. Returns the new node (projected meta on next GET).
  http.post('*/api/topology/customer-drop', async ({ request }) => {
    const body = CustomerDropSchema.parse(await request.json())
    const customer = CUSTOMER_FIXTURES.find((c) => c.id === body.customerId)
    if (!customer) {
      return new HttpResponse(JSON.stringify({ message: 'Pelanggan tidak ditemukan' }), {
        status: 404,
      })
    }
    const nodeId = `${customer.id}-node`
    if (TOPOLOGY_FIXTURES.some((n) => n.id === nodeId)) {
      return new HttpResponse(JSON.stringify({ message: 'Pelanggan sudah terpasang di peta' }), {
        status: 409,
      })
    }
    const odp = TOPOLOGY_FIXTURES.find((n) => n.id === body.odpId && n.type === 'odp')
    if (!odp) {
      return new HttpResponse(JSON.stringify({ message: 'ODP tidak ditemukan' }), { status: 404 })
    }
    // If the technician picked a specific port, reject precisely when it is gone
    // or already taken (someone else grabbed it) instead of the generic message.
    if (body.portNo != null) {
      const sp = CABLING_STORE.splitters.find((s) => s.nodeId === odp.id)
      const port = sp?.ports.find((p) => p.portNo === body.portNo)
      if (!port) {
        return new HttpResponse(
          JSON.stringify({
            message: `Port #${body.portNo} tidak ada di ODP ini.`,
          }),
          { status: 404 },
        )
      }
      if (port.outNodeId !== null) {
        return new HttpResponse(
          JSON.stringify({
            message: `Port #${body.portNo} sudah terpakai. Pilih port lain.`,
          }),
          { status: 409 },
        )
      }
    }
    const drop = allocateDrop(
      CABLING_STORE,
      TOPOLOGY_FIXTURES,
      odp,
      { id: nodeId, lat: body.lat, lng: body.lng, customerId: customer.id },
      {
        ponPort: customer.connection?.ponPort,
        onuSerial: customer.connection?.onuSerial,
      },
      body.portNo,
    )
    if (!drop) {
      return new HttpResponse(JSON.stringify({ message: 'Port splitter penuh. Pilih ODP lain.' }), {
        status: 409,
      })
    }
    // Network status follows lifecycle (aktif/isolir = light present); a fresh
    // install of a not-yet-provisioned subscriber reads `unknown` until lit.
    const netStatus =
      customer.status === 'aktif' || customer.status === 'isolir'
        ? ('up' as const)
        : ('unknown' as const)
    const node = {
      id: nodeId,
      name: customer.fullName,
      type: 'customer' as const,
      status: netStatus,
      lat: body.lat,
      lng: body.lng,
      parentId: odp.id,
      meta: {
        customerId: customer.id,
        planName: customer.planName,
        coreNo: drop.coreNo,
        lifecycle: customer.status,
        ...(customer.connection?.onuSerial ? { onuSerial: customer.connection.onuSerial } : {}),
        ...(customer.connection?.ponPort ? { ponPort: customer.connection.ponPort } : {}),
        ...(customer.connection?.rxPower != null
          ? { rxPowerDbm: customer.connection.rxPower }
          : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
      },
    }
    TOPOLOGY_FIXTURES.push(node)
    recordAudit(
      'topology.install',
      'Topologi',
      `Pelanggan "${customer.fullName}" dipasang di ${odp.name} (core ${drop.coreNo})`,
      'Admin',
      node.id,
    )
    persistDb()
    return HttpResponse.json(node, { status: 201 })
  }),
  http.post('*/api/topology', async ({ request }) => {
    const body = CreateNodeSchema.parse(await request.json())
    const metaEntries = {
      ...(body.ipAddress ? { ipAddress: body.ipAddress } : {}),
      ...(body.model ? { model: body.model } : {}),
    }
    const node = {
      id: crypto.randomUUID(),
      name: body.name,
      type: body.type,
      status: body.status,
      parentId: body.parentId,
      lat: body.lat,
      lng: body.lng,
      ...(Object.keys(metaEntries).length > 0 ? { meta: metaEntries } : {}),
    }
    TOPOLOGY_FIXTURES.push(node)
    // A new ODC/ODP gets a splitter (capacity source for the projection) at the
    // chosen ratio (default per tier).
    if (node.type === 'odc' || node.type === 'odp') {
      setSplitterRatio(node.id, body.splitterRatio ?? (node.type === 'odc' ? '1:4' : '1:8'))
    }
    recordAudit(
      'topology.create',
      'Topologi',
      `Node ${node.type.toUpperCase()} "${node.name}" ditambahkan`,
      'Admin',
      node.id,
    )
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
    const body = UpdateNodeSchema.parse(await request.json())
    const moved = body.lat !== undefined || body.lng !== undefined
    const parentChanged = body.parentId !== undefined && body.parentId !== found.parentId

    // A customer whose uplink changed may be re-homed to a different serving ODP.
    // Validate capacity on the NEW ODP first (against a shadow node carrying the
    // pending parent/coords) so a full target rejects WITHOUT mutating anything.
    let rehomedCore: number | undefined
    if (found.type === 'customer' && found.meta?.customerId && parentChanged) {
      const customer = CUSTOMER_FIXTURES.find((c) => c.id === found.meta?.customerId)
      const shadow = {
        ...found,
        parentId: body.parentId ?? found.parentId,
        lat: body.lat ?? found.lat,
        lng: body.lng ?? found.lng,
      }
      const res = rehomeCustomerDrop(CABLING_STORE, TOPOLOGY_FIXTURES, shadow, {
        ponPort: customer?.connection?.ponPort,
        onuSerial: customer?.connection?.onuSerial,
      })
      if (res.status === 'full') {
        return new HttpResponse(
          JSON.stringify({
            message: 'Port splitter penuh di ODP tujuan. Pilih ODP lain.',
          }),
          { status: 409 },
        )
      }
      if (res.status === 'rehomed') rehomedCore = res.coreNo
    }

    if (body.name !== undefined) found.name = body.name
    if (body.type !== undefined) found.type = body.type
    if (body.status !== undefined) found.status = body.status
    if (body.parentId !== undefined) found.parentId = body.parentId
    if (body.lat !== undefined) found.lat = body.lat
    if (body.lng !== undefined) found.lng = body.lng
    if (body.ipAddress !== undefined || body.model !== undefined) {
      found.meta = {
        ...found.meta,
        ...(body.ipAddress !== undefined ? { ipAddress: body.ipAddress } : {}),
        ...(body.model !== undefined ? { model: body.model } : {}),
      }
    }
    if (body.maintenance !== undefined) {
      found.meta = { ...found.meta, maintenance: body.maintenance }
    }
    if (rehomedCore !== undefined) {
      found.meta = { ...found.meta, coreNo: rehomedCore }
    }
    if (body.splitterRatio && (found.type === 'odc' || found.type === 'odp')) {
      setSplitterRatio(found.id, body.splitterRatio)
    }
    // Keep stored drop-cable geometry in step with a dragged node (its own drop,
    // or — if an ODP/pole moved — every drop fed from it).
    if (moved) syncNodeGeometry(CABLING_STORE, TOPOLOGY_FIXTURES, found)
    // Note the most significant change for the trail: maintenance > re-home >
    // move > generic.
    const change =
      body.maintenance !== undefined
        ? body.maintenance
          ? 'ditandai pemeliharaan'
          : 'selesai pemeliharaan'
        : rehomedCore !== undefined || parentChanged
          ? 'uplink dipindah'
          : moved
            ? 'lokasi digeser'
            : 'diperbarui'
    recordAudit(
      body.maintenance !== undefined ? 'topology.maintenance' : 'topology.update',
      'Topologi',
      `Node "${found.name}" ${change}`,
      'Admin',
      found.id,
    )
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
    // Cascade-free the cabling a node holds: a customer drop releases its
    // splitter port + strand + drop cable + circuit; an ODC/ODP removes its
    // splitter + closure. Keeps the projected capacity honest after a delete.
    if (removed?.type === 'customer' && removed.meta?.customerId) {
      freeDrop(CABLING_STORE, removed.meta.customerId, removed.id)
    }
    if (removed && (removed.type === 'odc' || removed.type === 'odp')) {
      const si = SPLITTER_FIXTURES.findIndex((s) => s.nodeId === removed.id)
      if (si !== -1) SPLITTER_FIXTURES.splice(si, 1)
      const ci = CLOSURE_FIXTURES.findIndex((c) => c.nodeId === removed.id)
      if (ci !== -1) CLOSURE_FIXTURES.splice(ci, 1)
    }
    // Reparent any children up to the removed node's parent so the tree stays connected.
    if (removed) {
      for (const n of TOPOLOGY_FIXTURES) {
        if (n.parentId === removed.id) n.parentId = removed.parentId
      }
    }
    TOPOLOGY_FIXTURES.splice(idx, 1)
    if (removed) {
      recordAudit(
        'topology.delete',
        'Topologi',
        `Node "${removed.name}" dihapus`,
        'Admin',
        removed.id,
      )
    }
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('*/api/cables', () =>
    HttpResponse.json({ items: CABLE_FIXTURES, total: CABLE_FIXTURES.length }),
  ),
  // Replace a cable's surveyed route; recompute lengthM from the polyline.
  http.patch('*/api/cables/:id', async ({ params, request }) => {
    const cable = CABLE_FIXTURES.find((c) => c.id === params.id)
    if (!cable) {
      return new HttpResponse(JSON.stringify({ message: 'Kabel tidak ditemukan' }), {
        status: 404,
      })
    }
    const body = UpdateCableRouteSchema.parse(await request.json())
    cable.route = body.route
    cable.lengthM = routeLength(body.route)
    persistDb()
    return HttpResponse.json(cable)
  }),
  http.get('*/api/strands', () =>
    HttpResponse.json({
      items: STRAND_FIXTURES,
      total: STRAND_FIXTURES.length,
    }),
  ),
  http.get('*/api/closures', () =>
    HttpResponse.json({
      items: CLOSURE_FIXTURES,
      total: CLOSURE_FIXTURES.length,
    }),
  ),
  http.get('*/api/splices', () =>
    HttpResponse.json({
      items: SPLICE_FIXTURES,
      total: SPLICE_FIXTURES.length,
    }),
  ),
  http.get('*/api/splitters', () =>
    HttpResponse.json({
      items: SPLITTER_FIXTURES,
      total: SPLITTER_FIXTURES.length,
    }),
  ),
  http.get('*/api/circuits', () =>
    HttpResponse.json({
      items: CIRCUIT_FIXTURES,
      total: CIRCUIT_FIXTURES.length,
    }),
  ),

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

  // Audit log (newest first). entityId is an equality filter applied before the
  // shared list-query engine handles q/sort/order/limit/offset.
  http.get('*/api/audit', ({ request }) => {
    const url = new URL(request.url)
    const entityId = url.searchParams.get('entityId')
    const rows = entityId ? AUDIT_FIXTURES.filter((e) => e.entityId === entityId) : AUDIT_FIXTURES
    return HttpResponse.json(
      applyListQuery(rows, url.searchParams, {
        searchFields: ['actor', 'action', 'entity', 'summary'],
        sortAccessors: {
          at: (e) => e.at,
          actor: (e) => e.actor,
          action: (e) => e.action,
          entity: (e) => e.entity,
        },
        // Default mirrors the backend ORDER BY at DESC (newest first).
        defaultCompare: (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0),
      }),
    )
  }),

  // WhatsApp notifications
  http.get('*/api/notifications/templates', () =>
    HttpResponse.json({
      items: NOTIFICATION_TEMPLATE_FIXTURES,
      total: NOTIFICATION_TEMPLATE_FIXTURES.length,
    }),
  ),
  http.patch('*/api/notifications/templates/:id', async ({ params, request }) => {
    const found = NOTIFICATION_TEMPLATE_FIXTURES.find((t) => t.id === params.id)
    if (!found) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const body = (await request.json()) as {
      body?: string
      enabled?: boolean
    }
    if (body.body !== undefined) found.body = body.body
    if (body.enabled !== undefined) found.enabled = body.enabled
    persistDb()
    return HttpResponse.json(found)
  }),
  http.get('*/api/notifications/log', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json(
      applyListQuery(NOTIFICATION_LOG_FIXTURES, url.searchParams, {
        searchFields: ['to', 'templateName'],
        sortAccessors: {
          at: (r) => r.at,
          to: (r) => r.to,
          templateName: (r) => r.templateName,
          status: (r) => r.status,
        },
        defaultCompare: (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0),
      }),
    )
  }),
  // Send a (test) message rendered from a template; appends to the log.
  http.post('*/api/notifications/send', async ({ request }) => {
    const body = (await request.json()) as { event: string; to: string }
    const tpl = NOTIFICATION_TEMPLATE_FIXTURES.find((t) => t.event === body.event)
    if (!tpl) {
      return new HttpResponse(JSON.stringify({ message: 'Template not found' }), {
        status: 404,
      })
    }
    NOTIFICATION_LOG_FIXTURES.unshift({
      id: crypto.randomUUID(),
      to: body.to,
      templateName: tpl.name,
      channel: 'whatsapp',
      status: 'sent',
      body: renderTemplate(tpl.body),
      at: new Date().toISOString(),
    })
    persistDb()
    return new HttpResponse(null, { status: 201 })
  }),

  // Customer self-service portal — "me" resolves to a representative subscriber
  // (a real backend resolves it from the customer's auth token).
  http.get('*/api/portal/me', () => {
    const me = CUSTOMER_FIXTURES.find((c) => c.status === 'aktif') ?? CUSTOMER_FIXTURES[0]
    if (!me) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      })
    }
    const invoices = INVOICE_FIXTURES.filter((inv) => inv.customerId === me.id)
    const payments = PAYMENT_FIXTURES.filter((p) => p.customerName === me.fullName)
    const tickets = TICKET_FIXTURES.filter((t) => t.customerName === me.fullName)
    return HttpResponse.json({ customer: me, invoices, payments, tickets })
  }),
  // Customer reports a problem → opens a support ticket on their account.
  http.post('*/api/portal/tickets', async ({ request }) => {
    const me = CUSTOMER_FIXTURES.find((c) => c.status === 'aktif') ?? CUSTOMER_FIXTURES[0]
    if (!me) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as { subject: string }
    const now = Date.now()
    const slaHours = SLA_HOURS.medium ?? 24
    const ticket = {
      id: crypto.randomUUID(),
      code: `TKT-${9000 + TICKET_FIXTURES.length}`,
      subject: body.subject,
      customerId: me.id,
      customerName: me.fullName,
      priority: 'medium' as const,
      status: 'open' as const,
      assignee: null,
      slaDueAt: new Date(now + slaHours * 3_600_000).toISOString(),
      createdAt: new Date(now).toISOString(),
    }
    TICKET_FIXTURES.unshift(ticket)
    persistDb()
    return HttpResponse.json(ticket, { status: 201 })
  }),
]
