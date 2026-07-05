import type { StatusTone } from '@/components/shared/status-badge'
import type { CustomerStatus } from '@/schemas/customer'
import type { DeviceStatus } from '@/schemas/device'
import type { InvoiceStatus } from '@/schemas/invoice'
import type { ResellerStatus } from '@/schemas/reseller'
import type { TicketStatus } from '@/schemas/ticket'
import type { WorkOrderStatus } from '@/schemas/workorder'

// Single source of truth for status → badge tone. Map an API enum value to a
// StatusTone at the display boundary; never rename the enum (see Language
// Policy). Consumers import the relevant map instead of redefining it.

export const customerStatusTone: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

export const invoiceStatusTone: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  partial: 'info',
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

// TicketStatus has two intentionally different mappings depending on context:
//
// - ticketStatusTone: the ops/tickets view, where an SLA badge sits alongside
//   and carries urgency, so the status badge is lifecycle-only (open=info).
// - ticketStatusToneCustomer: the customer-360 and customer portal, which have
//   no SLA badge, so an open ticket is flagged amber (open=warning) to signal
//   "this customer has an unresolved issue".
//
// They are NOT unified on purpose; if that divergence is ever deemed a bug,
// collapse them here (a visual change) rather than re-scattering copies.
export const ticketStatusTone: Record<TicketStatus, StatusTone> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  breached: 'danger',
}

export const ticketStatusToneCustomer: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  breached: 'danger',
}
