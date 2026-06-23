import type { StatusTone } from '@/components/shared/status-badge'
import type { CustomerStatus } from '@/schemas/customer'
import type { DeviceStatus } from '@/schemas/device'
import type { InvoiceStatus } from '@/schemas/invoice'
import type { ResellerStatus } from '@/schemas/reseller'
import type { WorkOrderStatus } from '@/schemas/workorder'

// Single source of truth for status → badge tone. Map an API enum value to a
// StatusTone at the display boundary; never rename the enum (see Language
// Policy). Consumers import the relevant map instead of redefining it.
//
// NOTE: TicketStatus is intentionally NOT here — it has two divergent mappings
// (the tickets feature uses open=info/in_progress=warning; the customer-360 and
// portal views use open=warning/in_progress=info), so it stays per-context.

export const customerStatusTone: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

export const invoiceStatusTone: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

export const deviceStatusTone: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

export const workOrderStatusTone: Record<WorkOrderStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'neutral',
}

export const resellerStatusTone: Record<ResellerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
}
