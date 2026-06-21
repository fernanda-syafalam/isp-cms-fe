import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { LedgerEntry, LedgerEntryType } from '@/schemas/reseller'

const LEDGER_TONE: Record<LedgerEntryType, StatusTone> = {
  topup: 'info',
  commission: 'success',
  deduction: 'warning',
  withdrawal: 'neutral',
}

// Stateless ledger columns (no component callbacks) — hoisted so they are not
// rebuilt per render. Sortable keys match the backend whitelist
// (at, type, amount, balanceAfter); "note" is free-text searched, not sorted.
export const ledgerColumns: ColumnDef<LedgerEntry>[] = [
  {
    accessorKey: 'at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
    meta: { title: 'Tanggal' },
    cell: ({ row }) => formatDateTime(row.original.at),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
    meta: { title: 'Tipe' },
    cell: ({ row }) => (
      <StatusBadge tone={LEDGER_TONE[row.original.type]} label={statusLabel(row.original.type)} />
    ),
  },
  {
    accessorKey: 'note',
    header: 'Catatan',
    meta: { title: 'Catatan' },
    enableSorting: false,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
    meta: { title: 'Jumlah', align: 'right' },
    cell: ({ row }) => {
      const positive = row.original.amount >= 0
      return (
        <span
          className={`font-mono tabular-nums ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {positive ? '+' : '−'}
          {formatCurrency(Math.abs(row.original.amount))}
        </span>
      )
    },
  },
  {
    accessorKey: 'balanceAfter',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
    meta: { title: 'Saldo', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.balanceAfter)}</span>
    ),
  },
]
