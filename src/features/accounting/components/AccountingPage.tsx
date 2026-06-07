import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, ScaleIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { downloadCsv } from '@/lib/csv'
import { formatCurrency, formatDate } from '@/lib/format'
import type { JournalLine } from '@/schemas/accounting'

import { useJournal } from '../hooks/useJournal'

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

export function AccountingPage() {
  const periods = useMemo(recentPeriods, [])
  const [period, setPeriod] = useState(() => periods[0] ?? '')
  const { data, isLoading, isError } = useJournal(period)

  const balanced = data ? data.totals.debit === data.totals.credit : true

  const columns = useMemo<ColumnDef<JournalLine>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Tanggal',
        meta: { title: 'Tanggal' },
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'accountCode',
        header: 'Kode',
        meta: { title: 'Kode' },
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.accountCode}</span>,
      },
      { accessorKey: 'accountName', header: 'Akun', meta: { title: 'Akun' } },
      {
        accessorKey: 'description',
        header: 'Keterangan',
        meta: { title: 'Keterangan' },
        cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
      },
      {
        accessorKey: 'debit',
        header: 'Debit',
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
        header: 'Kredit',
        meta: { title: 'Kredit', align: 'right' },
        cell: ({ row }) =>
          row.original.credit > 0 ? (
            <span className="font-mono tabular-nums">{formatCurrency(row.original.credit)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akuntansi (Jurnal GL)"
        description="Ekspor jurnal buku besar (basis kas) untuk impor ke software akuntansi."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-44" aria-label="Periode">
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
              disabled={!data?.lines.length}
              onClick={() => downloadCsv(`jurnal-${period}`, (data?.lines ?? []).map(toCsvRow))}
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
        />
        <KpiCard
          label="Total kredit"
          value={data?.totals.credit ?? 0}
          format={formatCurrency}
          icon={ScaleIcon}
        />
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-4">
          <StatusBadge
            tone={balanced ? 'success' : 'danger'}
            label={balanced ? 'Seimbang (balanced)' : 'Tidak seimbang'}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.lines}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Tidak ada transaksi pada periode ini."
        searchPlaceholder="Cari akun / keterangan…"
      />
    </div>
  )
}
