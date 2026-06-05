# ISP CMS — Feature Specification v2 (Frontend)

Status: **mock-first**, redesign in progress. Source of truth for what the
`isp-cms-fe` admin dashboard does and how the ISP business flow is modelled.
Grounded in competitor research (Splynx, UISP, Sonar, RL Radius, Sebilling,
BayarInternet, ISPMate, GenieACS) — see memory `isp-domain-model`.

Target ISP profile: **FTTH/GPON + PPPoE, postpaid + auto-isolir**, with
Mikrotik/RADIUS + GenieACS + payment-gateway/WhatsApp + reseller + field
technicians + inventory. Single-tenant. Backend mock-first (`docs/ADR/0003`).

## 1. The core idea: lifecycle is a billing-driven state machine

A subscriber is **not** a row with a passive `status` — its state drives (and is
driven by) billing and the network:

```
prospek ──(survey ok)──> instalasi ──(install done + provision)──> aktif
   aktif ──(overdue OR plan expired)──> isolir ──(payment)──> aktif
   aktif/isolir ──(stop request / long unpaid)──> berhenti
```

- **Two isolir triggers** (modelled separately): payment **overdue** and plan
  **expiry**. Reactivation is automatic on payment.
- **Isolir is an action**, not a flag: it blocks network access (Mikrotik/RADIUS)
  while whitelisting a payment page; mass-isolir runs on the billing date.
- The FE exposes the **transitions as actions** (isolir / aktivasi) and shows the
  state on the customer 360 + dashboard. Enforcement itself is backend/mock.

Status vocab (enum value → Indonesian label via `lib/status-label`):
`prospek` Prospek · `instalasi` Instalasi · `aktif` Aktif · `isolir` Isolir ·
`berhenti` Berhenti.

## 2. Domain model (FE contract; mock-first zod)

```
Customer {
  id, customerNo, fullName, phone, email?, address, areaName, resellerName?,
  planId, planName, status (lifecycle), joinedAt,
  outstanding,                         // piutang (IDR)
  connection: Connection | null        // null while prospek/instalasi
}
Connection {
  type 'pppoe' | 'gpon',
  pppoeUsername, profile,              // profile = plan rate-limit profile
  ipAddress,
  onuSerial?, olt?, ponPort?, rxPower? // GPON optical: rxPower in dBm (redaman)
}
Plan { id, name, speedMbps, priceMonthly, fupGb?, status }   // carries network params
Invoice { id, invoiceNo, customerId, customerName, periodStart, periodEnd,
          amount, lateFee?, status (paid|pending|overdue|draft), dueDate, paidAt? }
Payment { id, invoiceNo, customerName, amount, method, channel, paidAt }   // QRIS/VA/e-wallet/cash
Device { id, name, type (olt|onu|mikrotik), ipAddress, status, rxPower?, areaName, lastSeenAt }
Ticket { id, code, subject, customerName, priority, status, assignee?, slaDueAt, createdAt }
WorkOrder { id, code, type (instalasi|gangguan|dismantle), customerName, technician?, scheduledAt, status }
Reseller { id, name, area, balance, commissionPct, customerCount, status }
InventoryItem { id, kind (onu|router|mikrotik), serial, status (gudang|terpasang|rusak), assignedTo? }
Staff { id, email, fullName, role }   // real /v1/users
```

IDs are branded (`types/ids.ts`). RX Power range (GPON ITU-T) ≈ −8…−27 dBm;
healthy ≳ −25 dBm (used for the optical badge).

## 3. Modules & flows

| Module                   | Route               | Core flow                                                                                                                                                      |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**            | `/`                 | Aktif · Terisolir · MRR · **AR/piutang** · Tiket · **ONU offline** + revenue trend + ticket status                                                             |
| **Pelanggan (360)**      | `/customers`, `$id` | List + filter by lifecycle; **360 detail**: data + koneksi (ONU/redaman/IP/PPPoE) + paket + tagihan terakhir + tiket + **timeline** + **aksi isolir/aktivasi** |
| **Paket**                | `/plans`            | Profil + rate-limit + harga + FUP                                                                                                                              |
| **Tagihan**              | `/invoices`, `$id`  | Siklus, jatuh tempo, denda, status; detail                                                                                                                     |
| **Pembayaran**           | `/payments`         | Riwayat pembayaran + kanal (QRIS/VA/e-wallet/cash)                                                                                                             |
| **Jaringan**             | `/network/devices`  | OLT/ONU/Mikrotik, online/offline, **redaman dBm**                                                                                                              |
| **Instalasi/Work Order** | `/work-orders`      | Job order instalasi/gangguan, assign teknisi, jadwal                                                                                                           |
| **Reseller**             | `/resellers`        | Saldo/komisi + jumlah pelanggan                                                                                                                                |
| **Inventory**            | `/inventory`        | Stok perangkat (serial, gudang/terpasang/rusak)                                                                                                                |
| **Laporan**              | `/reports`          | Revenue, pertumbuhan, churn, AR aging                                                                                                                          |
| **Staf**                 | `/staff`            | Akun internal (real `/v1/users`)                                                                                                                               |

## 4. Gap vs v1 (what this redesign fixes)

- Lifecycle state-machine + **isolir/aktivasi actions** (was passive status).
- Plans carry **network params** (rate-limit/FUP), not just price.
- **Payments + AR/piutang**, late fee, billing cycle (was static invoices).
- **Connection/ONU** model (PPPoE secret, IP, ONU SN/OLT/PON, **redaman**).
- New modules: **Work Order**, **Reseller**, **Inventory**.
- Dashboard reframed to ISP operations (terisolir, AR, ONU offline).

## 5. Phasing (PR per phase) — all shipped

- ✅ **Phase 1**: this doc + design-system v2 + **Dashboard ISP** + **Customer
  360 + lifecycle + isolir/aktivasi**.
- ✅ **Phase 2**: Billing (late fee) + Payments + AR/piutang.
- ✅ **Phase 3**: Provisioning + Network (ONU/redaman, GenieACS reboot/WiFi
  mock) + Mikrotik/RADIUS routers.
- ✅ **Phase 4**: Work Order/technician + Reseller/loket + Inventory + WhatsApp
  reminder (mock).

## 6. Out of scope / unverified

Real integrations (Mikrotik/RADIUS/GenieACS/payment/WA) stay **mock**; real
backend later. **Unverified by research** (modelled as flagged assumptions):
exact proration arithmetic, late-fee formula, reseller commission hierarchy, and
MRR/churn/ARPU as standard KPIs (revenue + AR/piutang + network status are the
confirmed staples). Customer self-service portal and technician mobile app are
out of scope.
