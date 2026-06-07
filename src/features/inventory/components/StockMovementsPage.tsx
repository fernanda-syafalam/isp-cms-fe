import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import type { StockMovement, StockMovementType } from '@/schemas/inventory'

import { useStockMovements } from '../hooks/useInventory'

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

export function StockMovementsPage() {
  const { data, isLoading, isError } = useStockMovements()

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
        meta: { title: 'Waktu' },
        cell: ({ row }) => formatDateTime(row.original.at),
      },
      {
        accessorKey: 'serial',
        header: 'Serial',
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
    ],
    [],
  )

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
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada pergerakan stok."
        searchPlaceholder="Cari serial / keterangan…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('riwayat-stok', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}
