import type { TicketCategory } from '@/schemas/ticket'

// Display labels for the customer-facing ticket categories (P3.C.2). The enum
// values stay English in the contract; only the rendered copy is Indonesian.
export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  koneksi_putus: 'Koneksi putus',
  lambat: 'Internet lambat',
  tagihan: 'Tagihan',
  perangkat: 'Perangkat',
  lainnya: 'Lainnya',
}
