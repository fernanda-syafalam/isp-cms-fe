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
import { cn } from '@/lib/cn'
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

// Action verbs are namespaced ("billing.run", "customer.isolate"); colour the
// row by that category prefix so the operator can scan "who did what" fast.
const ACTION_DOT: Record<string, string> = {
  billing: 'bg-amber-500',
  payment: 'bg-emerald-500',
  customer: 'bg-blue-500',
  network: 'bg-violet-500',
  device: 'bg-violet-500',
  ticket: 'bg-sky-500',
  workorder: 'bg-orange-500',
  voucher: 'bg-pink-500',
  sla: 'bg-red-500',
  reseller: 'bg-teal-500',
  user: 'bg-indigo-500',
  auth: 'bg-indigo-500',
}
const actionDot = (action: string) =>
  ACTION_DOT[action.split('.')[0] ?? ''] ?? 'bg-muted-foreground'
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

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
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[0.65rem] text-muted-foreground">
          {initials(row.original.actor)}
        </span>
        <span className="text-sm">{row.original.actor}</span>
      </span>
    ),
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aksi" />,
    meta: { title: 'Aksi' },
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <span className={cn('size-1.5 shrink-0 rounded-full', actionDot(row.original.action))} />
        <span className="font-mono text-muted-foreground text-xs">{row.original.action}</span>
      </span>
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
  const { data, isLoading, isError, refetch } = useAuditLog({
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
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
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
      />
    </div>
  )
}
