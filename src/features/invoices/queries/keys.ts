import type { InvoiceFilter } from '@/api/invoices'

const root = ['invoices'] as const

export const invoiceKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: InvoiceFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  byCustomer: (customerId: string) => [...root, 'by-customer', customerId] as const,
}

const broot = ['billing'] as const

export const billingKeys = {
  all: broot,
  scheduler: () => [...broot, 'scheduler'] as const,
  schedulerPreview: () => [...broot, 'scheduler', 'preview'] as const,
}
