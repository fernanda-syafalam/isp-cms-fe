import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import type { AuditEntry } from '@/schemas/audit'

import { useAuditLog } from '../hooks/useAudit'

const toCsvRow = (e: AuditEntry) => ({
  Waktu: formatDateTime(e.at),
  Aktor: e.actor,
  Aksi: e.action,
  Entitas: e.entity,
  Keterangan: e.summary,
})

export function AuditLogPage() {
  const { data, isLoading, isError } = useAuditLog()

  const columns = useMemo<ColumnDef<AuditEntry>[]>(
    () => [
      {
        accessorKey: 'at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
        meta: { title: 'Waktu' },
        cell: ({ row }) => formatDateTime(row.original.at),
      },
      {
        accessorKey: 'actor',
        header: 'Aktor',
        meta: { title: 'Aktor' },
      },
      {
        accessorKey: 'action',
        header: 'Aksi',
        meta: { title: 'Aksi' },
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-xs">{row.original.action}</span>
        ),
      },
      {
        accessorKey: 'entity',
        header: 'Entitas',
        meta: { title: 'Entitas' },
      },
      {
        accessorKey: 'summary',
        header: 'Keterangan',
        meta: { title: 'Keterangan' },
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log audit"
        description="Jejak tindakan yang mengubah data: billing, isolir, pembayaran, dan lainnya."
      />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada aktivitas tercatat."
        searchPlaceholder="Cari aksi / aktor / keterangan…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('log-audit', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  )
}
