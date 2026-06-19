import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, ScaleIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/lib/format'
import type { JournalLine } from '@/schemas/accounting'

import { useExportJournal, useJournal } from '../hooks/useJournal'

// Last 6 months as "YYYY-MM", newest first.
function recentPeriods(): string[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

const periodLabel = (period: string) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(`${period}-01T00:00:00`),
  )

const toCsvRow = (l: JournalLine) => ({
  Tanggal: l.date.slice(0, 10),
  Kode: l.accountCode,
  Akun: l.accountName,
  Keterangan: l.description,
  Debit: l.debit,
  Kredit: l.credit,
})

// Static column defs (no component state). Sortable keys (date/accountCode/
// accountName/debit/credit) match the backend sort whitelist; Keterangan is a
// free-text column (searchable, not sortable).
const COLUMNS: ColumnDef<JournalLine>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
    meta: { title: 'Tanggal' },
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: 'accountCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.accountCode}</span>,
  },
  {
    accessorKey: 'accountName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Akun" />,
    meta: { title: 'Akun' },
  },
  {
    accessorKey: 'description',
    header: 'Keterangan',
    meta: { title: 'Keterangan' },
    cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
  },
  {
    accessorKey: 'debit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Debit" />,
    meta: { title: 'Debit', align: 'right' },
    cell: ({ row }) =>
      row.original.debit > 0 ? (
        <span className="font-mono tabular-nums">{formatCurrency(row.original.debit)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'credit',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kredit" />,
    meta: { title: 'Kredit', align: 'right' },
    cell: ({ row }) =>
      row.original.credit > 0 ? (
        <span className="font-mono tabular-nums">{formatCurrency(row.original.credit)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
]

export function AccountingPage() {
  const periods = useMemo(recentPeriods, [])
  const [period, setPeriod] = useState(() => periods[0] ?? '')
  const table = useTableQuery({ pageSize: 20 })
  const exportJournal = useExportJournal()
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isError } = useJournal(period, {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  // Period is a filter the table does not own — rewind to page 1 on change so
  // the user is never stranded on a now-out-of-range page.
  const handlePeriodChange = (next: string) => {
    setPeriod(next)
    table.resetPage()
  }

  // The balance badge is a period invariant: it reads the full-period `totals`
  // (server aggregate), never the current page of lines.
  const balanced = data ? data.totals.debit === data.totals.credit : true

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportJournal(period)
      downloadCsv(`jurnal-${period}`, result.lines.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akuntansi (Jurnal GL)"
        description="Ekspor jurnal buku besar (basis kas) untuk impor ke software akuntansi."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-11 w-44 sm:h-8" aria-label="Periode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {periodLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total debit"
          value={data?.totals.debit ?? 0}
          format={formatCurrency}
          icon={ScaleIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Total kredit"
          value={data?.totals.credit ?? 0}
          format={formatCurrency}
          icon={ScaleIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-4">
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : isError || !data ? (
            <span className="text-destructive text-sm">Gagal memuat</span>
          ) : (
            <StatusBadge
              tone={balanced ? 'success' : 'danger'}
              label={balanced ? 'Seimbang (balanced)' : 'Tidak seimbang'}
            />
          )}
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={data?.lines}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search
            ? `Tidak ada baris cocok dengan "${table.search}".`
            : 'Tidak ada transaksi pada periode ini.'
        }
        searchPlaceholder="Cari akun / keterangan…"
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
