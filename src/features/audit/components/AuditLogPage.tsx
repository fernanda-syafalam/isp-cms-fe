import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { AuditFilter } from '@/api/audit'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { AuditEntry } from '@/schemas/audit'

import { useAuditLog, useExportAudit } from '../hooks/useAudit'

const toCsvRow = (e: AuditEntry) => ({
  Waktu: formatDateTime(e.at),
  Aktor: e.actor,
  Aksi: e.action,
  Entitas: e.entity,
  Keterangan: e.summary,
})

// Static column defs (no component state): sortable keys (at/actor/action/
// entity) match the backend sort whitelist; the table delegates sorting.
const COLUMNS: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: 'at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
    meta: { title: 'Waktu' },
    cell: ({ row }) => formatDateTime(row.original.at),
  },
  {
    accessorKey: 'actor',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aktor" />,
    meta: { title: 'Aktor' },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aksi" />,
    meta: { title: 'Aksi' },
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">{row.original.action}</span>
    ),
  },
  {
    accessorKey: 'entity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entitas" />,
    meta: { title: 'Entitas' },
  },
  {
    accessorKey: 'summary',
    header: 'Keterangan',
    meta: { title: 'Keterangan' },
  },
]

export function AuditLogPage() {
  const table = useTableQuery({ pageSize: 20 })
  const exportAudit = useExportAudit()
  const [isExporting, setIsExporting] = useState(false)

  // Search/sort/paging come entirely from the table (global log, no filter).
  const baseFilter: AuditFilter = {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useAuditLog({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportAudit(baseFilter)
      downloadCsv('log-audit', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log audit"
        description="Jejak tindakan yang mengubah data: billing, isolir, pembayaran, dan lainnya."
      />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada aktivitas tercatat."
        searchPlaceholder="Cari aksi / aktor / keterangan…"
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
