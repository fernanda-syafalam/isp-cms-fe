// Display-boundary mapping from API enum values (English, kept as-is in the
// data) to Bahasa Indonesia labels shown to users. See CLAUDE.md Language
// Policy. Unknown values fall back to the raw value so nothing renders blank.
const STATUS_LABELS: Record<string, string> = {
  // customer lifecycle
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir',
  berhenti: 'Berhenti',
  // connection type
  pppoe: 'PPPoE',
  gpon: 'GPON',
  // plan
  active: 'Aktif',
  archived: 'Arsip',
  // invoice
  paid: 'Lunas',
  pending: 'Menunggu',
  overdue: 'Terlambat',
  draft: 'Draf',
  // device
  online: 'Online',
  degraded: 'Menurun',
  offline: 'Offline',
  // ticket status
  open: 'Terbuka',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  breached: 'Terlewat SLA',
  // ticket priority
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Mendesak',
  // coverage
  operational: 'Operasional',
  maintenance: 'Pemeliharaan',
  down: 'Mati',
  // role
  admin: 'Admin',
  staff: 'Staf',
  customer: 'Pelanggan',
  // payment method
  qris: 'QRIS',
  va: 'Virtual Account',
  ewallet: 'E-Wallet',
  transfer: 'Transfer',
  cash: 'Tunai',
}

/** Translate an API enum value to its Indonesian display label. */
export function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value
}
