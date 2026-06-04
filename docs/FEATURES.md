# ISP CMS — Feature Specification (Frontend)

Status: **draft / mock-first**. This document is the source of truth for what
the `isp-cms-fe` admin dashboard does, which modules exist, and the order we
build them. Each module's API is defined first as a Zod schema + MSW mock; the
backend implements the contract afterwards (see
`docs/ADR/0003-isp-modules-mock-first.md`).

## 1. Product

An internal admin dashboard for an **Internet Service Provider operator**.
Single-tenant: one ISP's staff manage their own subscribers, plans, billing,
network, and support. No customer-facing portal in this scope.

### Personas

| Persona           | Cares about                                                     |
| ----------------- | --------------------------------------------------------------- |
| Operations admin  | Subscribers, plans, activations, coverage                       |
| Billing staff     | Invoices, payments, overdue collection, revenue                 |
| NOC / network eng | Devices (OLT/ONU/Mikrotik), online/offline, IP/PPPoE, bandwidth |
| Support agent     | Tickets, SLA, customer history                                  |
| Owner / manager   | Reports: revenue, growth, churn, SLA                            |

### Non-functional baseline

- Locale **id-ID**, currency **IDR** (`Rp`); UI label text in English.
- Theme **dark by default** (toggleable), brand accent **blue/indigo**.
- Strict layering + Zod-at-boundary + a11y AA (see `CLAUDE.md`).
- Data-dense tables, minimalism, status colours (green up / amber pending /
  red down) — design direction per the `ui-ux-pro-max` skill.

## 2. Information architecture (sitemap)

```
/                       Dashboard (overview KPIs + charts)
Operations
  /customers            Subscribers list  → /customers/$id (detail)
  /plans                Service plans
  /invoices             Invoices list     → /invoices/$id (detail)
  /tickets              Support tickets    → /tickets/$id (detail)
Network
  /network/devices      OLT / ONU / Mikrotik devices, online/offline
  /coverage             Coverage areas / POPs
Insights
  /reports              Revenue / growth / churn / SLA analytics
Admin
  /staff                Internal staff & admin accounts (real /v1/users)
/login                  Auth (public)
```

Sidebar is grouped: **Overview · Operations · Network · Insights · Admin**.

## 3. Modules

Each module ships: Zod schema (`src/schemas/<m>.ts`), API + MSW mock
(`src/api/<m>.ts`, `src/test/msw/handlers.ts`), feature folder
(`src/features/<m>/`), and route(s). Depth column: **L** = list+filter+create,
**LD** = list + detail.

| #   | Module        | Route(s)            | Key entity fields                                                        | Depth | Data                 | Priority |
| --- | ------------- | ------------------- | ------------------------------------------------------------------------ | ----- | -------------------- | -------- |
| 1   | Dashboard     | `/`                 | KPI snapshot + revenue trend + network status                            | —     | mock                 | P0       |
| 2   | Customers     | `/customers`, `$id` | name, customerNo, phone, address, area, plan, status, joinedAt           | LD    | mock                 | P0       |
| 3   | Service Plans | `/plans`            | name, speedMbps, priceMonthly (IDR), status                              | L     | mock                 | P0       |
| 4   | Invoices      | `/invoices`, `$id`  | invoiceNo, customer, period, amount, status, dueDate, paidAt             | LD    | mock                 | P0       |
| 5   | Devices       | `/network/devices`  | name, type (olt/onu/mikrotik), ip, status (online/offline), uptime, area | L     | mock                 | P1       |
| 6   | Tickets       | `/tickets`, `$id`   | subject, customer, priority, status, slaDueAt, assignee                  | LD    | mock                 | P1       |
| 7   | Coverage/POP  | `/coverage`         | name, type (pop/area), region, capacity, utilisation, status             | L     | mock                 | P2       |
| 8   | Reports       | `/reports`          | aggregates (revenue, new vs churned, ARPU, SLA)                          | —     | mock                 | P2       |
| 9   | Staff         | `/staff`            | id, email, fullName, role (admin/staff/customer)                         | L     | **real** `/v1/users` | P0       |

### Status vocabularies (→ `StatusBadge` tone)

- Customer: `active` (success), `pending` (warning), `suspended` (danger), `inactive` (neutral)
- Invoice: `paid` (success), `pending` (warning), `overdue` (danger), `draft` (neutral)
- Device: `online` (success), `degraded` (warning), `offline` (danger)
- Ticket: `open` (info), `in_progress` (warning), `resolved` (success), `breached` (danger)

## 4. Data model sketch (FE contract)

These are the FE-owned shapes (mirrored as Zod). Backend must conform.

```
Customer   { id, customerNo, fullName, phone, email?, address, areaId, planId, status, joinedAt }
Plan       { id, name, speedMbps, priceMonthly, status }
Invoice    { id, invoiceNo, customerId, periodStart, periodEnd, amount, status, dueDate, paidAt? }
Device     { id, name, type, ipAddress, status, uptimeHours, areaId, lastSeenAt }
Ticket     { id, code, subject, customerId, priority, status, assignee?, slaDueAt, createdAt }
Coverage   { id, name, type, region, capacity, activeConnections, status }
Staff      { id, email, fullName, role }   // === /v1/users
```

IDs are branded (`types/ids.ts`) per the constitution.

## 5. Roadmap / phasing

- **Phase A (this change)** — design system (dark+blue), shell+nav, Dashboard
  overview, and all modules scaffolded mock-first to the table above. Staff
  wired to the real `/v1/users`.
- **Phase B** — wire P0 modules (Customers, Plans, Invoices) to real backend
  endpoints once they exist; replace MSW with live calls.
- **Phase C** — Devices live status (SSE/poll), Tickets SLA timers, Reports
  real aggregates, exports (CSV/PDF).

## 6. Out of scope (this change)

Customer self-service portal · multi-tenant/reseller · payment-gateway
integration · real-time websockets · granular per-module RBAC · multi-language.
