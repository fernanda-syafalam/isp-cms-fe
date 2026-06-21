import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Voucher, VoucherStatus } from '@/schemas/voucher'

import { VoucherRowActions } from './VoucherRowActions'

export const STATUS_TONE: Record<VoucherStatus, StatusTone> = {
  unused: 'info',
  used: 'success',
  expired: 'neutral',
}

export const toCsvRow = (v: Voucher) => ({
  Kode: v.code,
  Batch: v.batchId,
  Profil: v.profile,
  Harga: formatCurrency(v.priceIdr),
  'Masa aktif (hari)': v.durationDays,
  Status: statusLabel(v.status),
  Dibuat: formatDate(v.createdAt),
})

// Static column defs (no component state). Sortable keys (code/priceIdr/
// durationDays/status) match the backend sort whitelist; Profil/Batch are plain.
export const voucherColumns: ColumnDef<Voucher>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => <span className="font-medium font-mono text-sm">{row.original.code}</span>,
  },
  {
    accessorKey: 'profile',
    header: 'Profil',
    meta: { title: 'Profil' },
  },
  {
    accessorKey: 'priceIdr',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
    meta: { title: 'Harga', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.priceIdr)}</span>
    ),
  },
  {
    accessorKey: 'durationDays',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Masa aktif" />,
    meta: { title: 'Masa aktif' },
    cell: ({ row }) => `${formatNumber(row.original.durationDays)} hari`,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={statusLabel(row.original.status)}
      />
    ),
  },
  {
    accessorKey: 'batchId',
    header: 'Batch',
    meta: { title: 'Batch' },
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">{row.original.batchId}</span>
    ),
  },
  {
    id: 'actions',
    meta: { title: 'Aksi', align: 'right' },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <VoucherRowActions voucher={row.original} />
      </div>
    ),
  },
]
