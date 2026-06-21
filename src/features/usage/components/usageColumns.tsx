import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatNumber } from '@/lib/format'
import type { UsageRecord } from '@/schemas/usage'

const pct = (used: number, quota: number) =>
  quota <= 0 ? 0 : Math.min(100, Math.round((used / quota) * 100))

export const toCsvRow = (u: UsageRecord) => ({
  Pelanggan: u.customerName,
  Paket: u.planName,
  'Kuota (GB)': u.quotaGb === 0 ? 'Unlimited' : u.quotaGb,
  'Terpakai (GB)': u.usedGb,
  Status: u.fupThrottled ? 'FUP' : 'Normal',
})

// Static column defs (no component state): the usage bar + FUP badge are pure
// functions of the row.
export const usageColumns: ColumnDef<UsageRecord>[] = [
  {
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
    meta: { title: 'Pelanggan' },
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.customerId }}
        className="font-medium hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
  },
  { accessorKey: 'planName', header: 'Paket', meta: { title: 'Paket' } },
  {
    accessorKey: 'quotaGb',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kuota" />,
    meta: { title: 'Kuota', align: 'right' },
    cell: ({ row }) =>
      row.original.quotaGb === 0 ? (
        <span className="text-muted-foreground">Unlimited</span>
      ) : (
        <span className="font-mono tabular-nums">{formatNumber(row.original.quotaGb)} GB</span>
      ),
  },
  {
    accessorKey: 'usedGb',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pemakaian" />,
    meta: { title: 'Pemakaian' },
    cell: ({ row }) => {
      const { usedGb, quotaGb } = row.original
      const p = pct(usedGb, quotaGb)
      return (
        <div className="w-40">
          <div className="flex justify-between text-xs">
            <span className="font-mono tabular-nums">{formatNumber(usedGb)} GB</span>
            {quotaGb > 0 ? <span className="text-muted-foreground">{p}%</span> : null}
          </div>
          {quotaGb > 0 ? (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${Math.max(2, p)}%` }}
              />
            </div>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'fupThrottled',
    header: 'Status',
    meta: { title: 'Status' },
    cell: ({ row }) =>
      row.original.fupThrottled ? (
        <StatusBadge tone="warning" label="FUP (dibatasi)" />
      ) : (
        <StatusBadge tone="success" label="Normal" />
      ),
  },
]
