import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { StockMovementFilter } from '@/api/inventory'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { StockMovement, StockMovementType } from '@/schemas/inventory'

import { useExportStockMovements, useStockMovements } from '../hooks/useInventory'

// Domain-specific labels — kept local rather than in the shared status map.
const TYPE_LABEL: Record<StockMovementType, string> = {
  in: 'Stok masuk',
  assign: 'Dipasang',
  return: 'Dikembalikan',
  broken: 'Rusak',
}

const TYPE_TONE: Record<StockMovementType, StatusTone> = {
  in: 'info',
  assign: 'success',
  return: 'neutral',
  broken: 'danger',
}

const toCsvRow = (m: StockMovement) => ({
  Waktu: formatDateTime(m.at),
  Serial: m.serial,
  Jenis: m.kind.toUpperCase(),
  Pergerakan: TYPE_LABEL[m.type],
  Keterangan: m.note,
})

// Static column defs (no component state): sortable keys (at/serial/kind/type)
// match the backend sort whitelist; note is free text, so it stays unsorted.
const COLUMNS: ColumnDef<StockMovement>[] = [
  {
    accessorKey: 'at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
    meta: { title: 'Waktu' },
    cell: ({ row }) => formatDateTime(row.original.at),
  },
  {
    accessorKey: 'serial',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Serial" />,
    meta: { title: 'Serial' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
  },
  {
    accessorKey: 'kind',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
    meta: { title: 'Jenis' },
    cell: ({ row }) => <span className="uppercase">{row.original.kind}</span>,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pergerakan" />,
    meta: { title: 'Pergerakan' },
    cell: ({ row }) => (
      <StatusBadge tone={TYPE_TONE[row.original.type]} label={TYPE_LABEL[row.original.type]} />
    ),
  },
  {
    accessorKey: 'note',
    header: 'Keterangan',
    meta: { title: 'Keterangan' },
    cell: ({ row }) => row.original.note || '—',
  },
]

export function StockMovementsPage() {
  const table = useTableQuery({ pageSize: 20 })
  const exportStockMovements = useExportStockMovements()
  const [isExporting, setIsExporting] = useState(false)

  // Search/sort/paging come entirely from the table (no equality filter here).
  const baseFilter: StockMovementFilter = {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useStockMovements({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportStockMovements(baseFilter)
      downloadCsv('riwayat-stok', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/inventory">
          <ArrowLeftIcon className="size-4" />
          Kembali ke inventaris
        </Link>
      </Button>
      <PageHeader
        title="Riwayat stok"
        description="Jejak keluar-masuk perangkat: masuk gudang, dipasang, dikembalikan, rusak."
      />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada pergerakan stok."
        searchPlaceholder="Cari serial / keterangan…"
        server={{
          pageIndex: table.pageIndex,
          pageSize: table.pageSize,
          rowCount: total,
          sorting: table.sorting,
          search: table.search,
          onPaginationChange: table.onPaginationChange,
          onSortingChange: table.onSortingChange,
          onSearchChange: table.onSearchChange,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!total || isExporting}
            onClick={handleExport}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}
