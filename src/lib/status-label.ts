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
  partial: 'Sebagian',
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
  teknisi: 'Teknisi',
  mitra: 'Mitra',
  // payment method
  qris: 'QRIS',
  va: 'Virtual Account',
  ewallet: 'E-Wallet',
  transfer: 'Transfer',
  cash: 'Tunai',
  // reseller
  inactive: 'Nonaktif',
  // work order type
  install: 'Instalasi',
  repair: 'Gangguan',
  dismantle: 'Pencabutan',
  // work order status
  scheduled: 'Terjadwal',
  done: 'Selesai',
  cancelled: 'Batal',
  // inventory status
  warehouse: 'Gudang',
  installed: 'Terpasang',
  broken: 'Rusak',
  // voucher status
  unused: 'Belum dipakai',
  used: 'Terpakai',
  expired: 'Kedaluwarsa',
  // reseller ledger entry type
  topup: 'Top-up',
  commission: 'Komisi',
  deduction: 'Potongan',
  withdrawal: 'Penarikan',
  // contract status (draft already mapped above)
  sent: 'Terkirim',
  signed: 'Ditandatangani',
  // lead pipeline stage
  new: 'Baru',
  survey: 'Survei',
  quote: 'Penawaran',
  won: 'Menang',
  lost: 'Kalah',
  // lead source (online already mapped under device status above)
  walk_in: 'Datang langsung',
  referral: 'Referral',
  reseller: 'Reseller',
  // sla credit status (pending already mapped under invoice above)
  applied: 'Diterapkan',
  void: 'Dibatalkan',
}

/** Translate an API enum value to its Indonesian display label. */
export function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value
}

// Display label for a customer's lifecycle state that distinguishes a
// voluntary hold (cuti) from a punitive isolir (P3.A.3). Both are `isolir`
// on the wire; only the label differs.
export function customerStatusLabel(
  status: string,
  holdReason: 'overdue' | 'voluntary' | null | undefined,
): string {
  if (status === 'isolir' && holdReason === 'voluntary') return 'Cuti'
  return statusLabel(status)
}
