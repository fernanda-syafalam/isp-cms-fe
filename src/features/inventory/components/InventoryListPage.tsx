import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { statusLabel } from '@/lib/status-label'
import type { InventoryItem, InventoryStatus } from '@/schemas/inventory'

import { useInventoryList } from '../hooks/useInventory'

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  warehouse: 'info',
  installed: 'success',
  broken: 'danger',
}

const STATUS_OPTIONS = ['all', 'warehouse', 'installed', 'broken'] as const

export function InventoryListPage() {
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError } = useInventoryList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: 'serial',
        header: 'Serial',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
      },
      {
        accessorKey: 'kind',
        header: 'Jenis',
        cell: ({ row }) => <span className="uppercase">{row.original.kind}</span>,
      },
      {
        accessorKey: 'assignedTo',
        header: 'Terpasang di',
        cell: ({ row }) => row.original.assignedTo ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris" description="Stok perangkat ONU, router, dan Mikrotik." />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Filter status">
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
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada perangkat di inventaris."
        />
      </div>
    </div>
  )
}
