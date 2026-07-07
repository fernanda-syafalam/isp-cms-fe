import type { z } from 'zod'

import { AcsDeviceListSchema } from '@/schemas/acs'
import { BranchListSchema } from '@/schemas/branch'
import { CoverageListSchema } from '@/schemas/coverage'
import { CustomerListSchema } from '@/schemas/customer'
import { DeviceListSchema } from '@/schemas/device'
import { InvoiceListSchema } from '@/schemas/invoice'
import { DeviceMetricListSchema } from '@/schemas/monitoring'
import { OdpListSchema } from '@/schemas/odp'
import { PlanListSchema } from '@/schemas/plan'
import { ResellerListSchema } from '@/schemas/reseller'
import { RouterListSchema } from '@/schemas/router'
import { SlaCreditListSchema } from '@/schemas/slaCredit'
import { TicketListSchema } from '@/schemas/ticket'
import { VoucherListSchema } from '@/schemas/voucher'
import { WorkOrderListSchema } from '@/schemas/workorder'

// BE-derived fixtures. Each JSON mirrors the REAL backend (isp-cms-be)
// response DTO for that list endpoint — NOT the MSW handler output. See
// ./fixtures/README.md for how each is derived and how to re-verify it.
import acsDevicesList from './fixtures/acs.devices.list.json'
import branchesList from './fixtures/branches.list.json'
import coverageList from './fixtures/coverage.list.json'
import customersList from './fixtures/customers.list.json'
import devicesList from './fixtures/devices.list.json'
import invoicesList from './fixtures/invoices.list.json'
import monitoringMetricsList from './fixtures/monitoring.metrics.list.json'
import odpList from './fixtures/odp.list.json'
import plansList from './fixtures/plans.list.json'
import resellersList from './fixtures/resellers.list.json'
import routersList from './fixtures/routers.list.json'
import slaCreditsList from './fixtures/sla-credits.list.json'
import ticketsList from './fixtures/tickets.list.json'
import vouchersList from './fixtures/vouchers.list.json'
import workOrdersList from './fixtures/work-orders.list.json'

// One entry per list endpoint the FE consumes. `feSchema` is the exact schema
// the FE `api/*.ts` function parses the response with; `beFixture` is a
// representative body derived from the BE response DTO on `origin/main`.
export type ContractEntry = {
  // Human-readable BE route, used in the test title + failure message.
  readonly endpoint: string
  // The FE zod schema (source of truth for the wire shape, ADR-0011 rule 1).
  readonly feSchema: z.ZodType
  // BE-derived example body. `unknown` on purpose: the fixture must be judged
  // by the schema, never typed FROM it (that would make the assertion vacuous).
  readonly beFixture: unknown
}

// Aligned endpoints: the BE-derived fixture is expected to satisfy the FE
// schema. A failure here is a real FE↔BE contract drift and must fail CI.
export const ALIGNED: readonly ContractEntry[] = [
  {
    endpoint: 'GET /v1/work-orders',
    feSchema: WorkOrderListSchema,
    beFixture: workOrdersList,
  },
  {
    endpoint: 'GET /v1/monitoring/metrics',
    feSchema: DeviceMetricListSchema,
    beFixture: monitoringMetricsList,
  },
  {
    endpoint: 'GET /v1/acs/devices',
    feSchema: AcsDeviceListSchema,
    beFixture: acsDevicesList,
  },
  {
    endpoint: 'GET /v1/coverage',
    feSchema: CoverageListSchema,
    beFixture: coverageList,
  },
  {
    endpoint: 'GET /v1/devices',
    feSchema: DeviceListSchema,
    beFixture: devicesList,
  },
  { endpoint: 'GET /v1/plans', feSchema: PlanListSchema, beFixture: plansList },
  {
    endpoint: 'GET /v1/resellers',
    feSchema: ResellerListSchema,
    beFixture: resellersList,
  },
  {
    endpoint: 'GET /v1/routers',
    feSchema: RouterListSchema,
    beFixture: routersList,
  },
  {
    endpoint: 'GET /v1/tickets',
    feSchema: TicketListSchema,
    beFixture: ticketsList,
  },
  // Promoted from KNOWN_DRIFT after BE PR #115 added the previously-missing
  // fields (summary.byStatus / summary.available / summary.total+void /
  // summary.expired / items[].billingAnchorDay). Fixtures re-derived to include
  // them; each now satisfies its FE schema.
  {
    endpoint: 'GET /v1/invoices',
    feSchema: InvoiceListSchema,
    beFixture: invoicesList,
  },
  {
    endpoint: 'GET /v1/branches',
    feSchema: BranchListSchema,
    beFixture: branchesList,
  },
  { endpoint: 'GET /v1/odp', feSchema: OdpListSchema, beFixture: odpList },
  {
    endpoint: 'GET /v1/sla-credits',
    feSchema: SlaCreditListSchema,
    beFixture: slaCreditsList,
  },
  {
    endpoint: 'GET /v1/vouchers',
    feSchema: VoucherListSchema,
    beFixture: vouchersList,
  },
  {
    endpoint: 'GET /v1/customers',
    feSchema: CustomerListSchema,
    beFixture: customersList,
  },
]

// A known FE↔BE drift is one where the BE-derived fixture reflects a real
// backend that does NOT yet return an FE-required field at `missingPaths`, so
// the FE schema rejects it. The test asserts that rejection at the exact path,
// which:
//   1. documents + locks the drift (green while the gap exists), and
//   2. turns RED the moment the BE closes the gap and the fixture is
//      re-derived — the signal to move the entry into ALIGNED.
export type KnownDriftEntry = ContractEntry & {
  // zod error paths (dot-joined) the FE schema reports as missing. Every one
  // listed must appear in the parse issues.
  readonly missingPaths: readonly string[]
  // Where the fix is tracked.
  readonly followUp: string
}

// Empty: BE PR #115 closed the last six known drifts (invoices/branches
// summary.byStatus, odp summary.available, sla-credits summary.total+void,
// vouchers summary.expired, customers items[].billingAnchorDay). Their fixtures
// were re-derived to include the fields and the entries promoted to ALIGNED.
// New drift found via a re-derived fixture goes here with an accurate
// `missingPaths` + `followUp`.
export const KNOWN_DRIFT: readonly KnownDriftEntry[] = []
