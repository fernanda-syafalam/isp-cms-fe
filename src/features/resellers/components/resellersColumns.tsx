import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { resellerStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Reseller } from '@/schemas/reseller'

import { ResellerRowActions } from './ResellerRowActions'

export const toCsvRow = (r: Reseller) => ({
  Reseller: r.name,
  Area: r.area,
  Pelanggan: r.customerCount,
  Komisi: formatPercent(r.commissionPct),
  Saldo: formatCurrency(r.balance),
  Status: statusLabel(r.status),
})

// Static column defs (no component state): sortable keys (name/commissionPct/
// balance/status) match the backend sort whitelist. customerCount is derived
// server-side (counted by name), not a sortable column, so it stays unsorted.
export const resellerColumns: ColumnDef<Reseller>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reseller" />,
    meta: { title: 'Reseller' },
    cell: ({ row }) => (
      <Link
        to="/resellers/$resellerId"
        params={{ resellerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: 'area', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'customerCount',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.customerCount)}</span>
    ),
  },
  {
    accessorKey: 'commissionPct',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Komisi" />,
    meta: { title: 'Komisi', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatPercent(row.original.commissionPct)}</span>
    ),
  },
  {
    accessorKey: 'balance',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
    meta: { title: 'Saldo', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.balance)}</span>
    ),
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
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <ResellerRowActions reseller={row.original} />,
  },
]
