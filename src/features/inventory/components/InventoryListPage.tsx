import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, HistoryIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCan } from '@/features/auth'
import { downloadCsv } from '@/lib/csv'
import { statusLabel } from '@/lib/status-label'
import type { InventoryItem, InventoryStatus } from '@/schemas/inventory'

import { useInventoryList } from '../hooks/useInventory'
import { InventoryRowActions } from './InventoryRowActions'
import { StockInDialog } from './StockInDialog'

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  warehouse: 'info',
  installed: 'success',
  broken: 'danger',
}

const STATUS_OPTIONS = ['all', 'warehouse', 'installed', 'broken'] as const

const toCsvRow = (i: InventoryItem) => ({
  Serial: i.serial,
  Jenis: i.kind.toUpperCase(),
  'Terpasang di': i.assignedTo ?? '—',
  Status: statusLabel(i.status),
})

export function InventoryListPage() {
  const [status, setStatus] = useState('all')
  const canManage = useCan('network.manage')
  const { data, isLoading, isError } = useInventoryList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: 'serial',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Serial" />,
        meta: { title: 'Serial' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
      },
      {
        accessorKey: 'kind',
        header: 'Jenis',
        meta: { title: 'Jenis' },
        cell: ({ row }) => <span className="uppercase">{row.original.kind}</span>,
      },
      {
        accessorKey: 'assignedTo',
        header: 'Terpasang di',
        meta: { title: 'Terpasang di' },
        cell: ({ row }) =>
          row.original.assignedCustomerId ? (
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.original.assignedCustomerId }}
              className="font-medium hover:underline"
            >
              {row.original.assignedTo}
            </Link>
          ) : (
            (row.original.assignedTo ?? '—')
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
        cell: ({ row }) => <InventoryRowActions item={row.original} />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris" description="Stok perangkat ONU, router, dan Mikrotik." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada perangkat di inventaris."
        searchPlaceholder="Cari serial / pelanggan…"
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? 'Semua status' : statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link to="/inventory/movements">
                <HistoryIcon className="size-4" />
                <span className="hidden sm:inline">Riwayat stok</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!data?.items.length}
              onClick={() => downloadCsv('inventaris', (data?.items ?? []).map(toCsvRow))}
            >
              <DownloadIcon className="size-4" />
              <span className="hidden sm:inline">Ekspor</span>
            </Button>
            {canManage ? <StockInDialog /> : null}
          </>
        }
      />
    </div>
  )
}
