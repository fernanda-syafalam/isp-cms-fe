import { getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2Icon, DownloadIcon, TicketIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { VoucherFilter } from '@/api/vouchers'
import { KpiCard } from '@/components/shared/kpi-card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Voucher, VoucherStatus } from '@/schemas/voucher'

import { useExportVouchers, useVouchersList } from '../hooks/useVouchers'
import { GenerateBatchDialog } from './GenerateBatchDialog'
import { VoucherRowActions } from './VoucherRowActions'

const STATUS_TONE: Record<VoucherStatus, StatusTone> = {
  unused: 'info',
  used: 'success',
  expired: 'neutral',
}

const STATUS_OPTIONS = ['all', 'unused', 'used', 'expired'] as const

const toCsvRow = (v: Voucher) => ({
  Kode: v.code,
  Batch: v.batchId,
  Profil: v.profile,
  Harga: formatCurrency(v.priceIdr),
  'Masa aktif (hari)': v.durationDays,
  Status: statusLabel(v.status),
  Dibuat: formatDate(v.createdAt),
})

// Static column defs (no component state). Sortable keys (code/priceIdr/
// durationDays/status) match the backend sort whitelist; Profil/Batch are plain.
const COLUMNS: ColumnDef<Voucher>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => <span className="font-medium font-mono text-sm">{row.original.code}</span>,
  },
  {
    accessorKey: 'profile',
    header: 'Profil',
    meta: { title: 'Profil' },
  },
  {
    accessorKey: 'priceIdr',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
    meta: { title: 'Harga', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.priceIdr)}</span>
    ),
  },
  {
    accessorKey: 'durationDays',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Masa aktif" />,
    meta: { title: 'Masa aktif' },
    cell: ({ row }) => `${formatNumber(row.original.durationDays)} hari`,
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
    accessorKey: 'batchId',
    header: 'Batch',
    meta: { title: 'Batch' },
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">{row.original.batchId}</span>
    ),
  },
  {
    id: 'actions',
    meta: { title: 'Aksi', align: 'right' },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <VoucherRowActions voucher={row.original} />
      </div>
    ),
  },
]

const routeApi = getRouteApi('/_auth/vouchers')

export function VouchersListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canManage = useCan('vouchers.manage')
  const table = useTableQuery({ pageSize: 20 })
  const exportVouchers = useExportVouchers()
  const [isExporting, setIsExporting] = useState(false)

  // Status is a URL filter the table does not own — rewind to page 1 on change.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: VoucherFilter = {
    status: status === 'all' ? undefined : status,
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useVouchersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // KPI summary is a full-set server aggregate (ignores status/q/paging), so the
  // cards stay correct under any table filter.
  const summary = data?.summary

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportVouchers(baseFilter)
      downloadCsv('voucher', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voucher"
        description="Voucher prepaid hotspot / PPPoE — buat batch & pantau penukaran."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!summary ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="Total voucher"
              value={summary.total}
              hint="seluruh batch"
              icon={TicketIcon}
            />
            <KpiCard
              label="Belum dipakai"
              value={summary.unused}
              hint="siap dijual"
              accent="amber"
              icon={TicketIcon}
            />
            <KpiCard
              label="Terpakai"
              value={summary.used}
              hint="sudah ditukar"
              hintTone="positive"
              icon={CheckCircle2Icon}
            />
            <KpiCard
              label="Pendapatan voucher"
              value={summary.revenue}
              format={formatCurrency}
              hint="dari voucher terpakai"
              icon={WalletIcon}
            />
          </>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage={
          table.search ? `Tidak ada voucher cocok dengan "${table.search}".` : 'Belum ada voucher.'
        }
        searchPlaceholder="Cari kode / profil…"
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
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 w-full sm:h-8 sm:w-40" aria-label="Filter status">
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
            {canManage ? <GenerateBatchDialog /> : null}
          </>
        }
      />
    </div>
  )
}
