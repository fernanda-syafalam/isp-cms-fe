import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDateTime } from '@/lib/format'
import type { AcsDevice } from '@/schemas/acs'

// Static column defs (no component state). Sortable keys (serial/rxPowerDbm)
// match the backend sort whitelist; the rest are plain headers.
export const acsColumns: ColumnDef<AcsDevice>[] = [
  {
    accessorKey: 'serial',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Serial ONU" />,
    meta: { title: 'Serial ONU' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
  },
  {
    accessorKey: 'customerName',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan' },
    // An ACS device's id is the subscriber id (built from CUSTOMER_FIXTURES).
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
  },
  { accessorKey: 'model', header: 'Model', meta: { title: 'Model' } },
  {
    accessorKey: 'firmware',
    header: 'Firmware',
    meta: { title: 'Firmware' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.firmware}</span>,
  },
  {
    accessorKey: 'rxPowerDbm',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
    meta: { title: 'Redaman', align: 'right' },
    cell: ({ row }) =>
      row.original.rxPowerDbm == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="font-mono tabular-nums">{row.original.rxPowerDbm} dBm</span>
      ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.status === 'online' ? 'success' : 'danger'}
        label={row.original.status === 'online' ? 'Online' : 'Offline'}
      />
    ),
  },
  {
    accessorKey: 'lastInform',
    header: 'Inform terakhir',
    meta: { title: 'Inform terakhir' },
    cell: ({ row }) => formatDateTime(row.original.lastInform),
  },
]
