import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BellRingIcon,
  DownloadIcon,
  ReceiptTextIcon,
  TriangleAlertIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { InvoiceFilter } from '@/api/invoices'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'

import { useRemindOverdue } from '../hooks/useBilling'
import { useExportInvoices, useInvoicesList } from '../hooks/useInvoices'
import { BillingActions } from './BillingActions'
import { InvoiceDetailSheet } from './InvoiceDetailSheet'

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

const toCsvRow = (inv: Invoice) => ({
  'No. Tagihan': inv.invoiceNo,
  Pelanggan: inv.customerName,
  DPP: formatCurrency(inv.amount),
  PPN: formatCurrency(inv.taxAmount),
  Jumlah: formatCurrency(invoiceTotal(inv)),
  'Jatuh tempo': formatDate(inv.dueDate),
  Status: statusLabel(inv.status),
  Pengingat: inv.lastRemindedAt ? formatDate(inv.lastRemindedAt) : '—',
})

// Static column defs (no component state). Sortable keys (invoiceNo/amount/
// dueDate/status/lastRemindedAt) match the backend sort whitelist; Pelanggan is
// a plain header.
const COLUMNS: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="No. Tagihan" />,
    meta: { title: 'No. Tagihan' },
    cell: ({ row }) => (
      <Link
        to="/invoices/$invoiceId"
        params={{ invoiceId: row.original.id }}
        className="font-medium font-mono text-sm hover:underline"
      >
        {row.original.invoiceNo}
      </Link>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan' },
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.customerId }}
        className="font-medium hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
    meta: { title: 'Jumlah', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(invoiceTotal(row.original))}</span>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jatuh tempo" />,
    meta: { title: 'Jatuh tempo' },
    cell: ({ row }) => formatDate(row.original.dueDate),
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
    accessorKey: 'lastRemindedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pengingat" />,
    meta: { title: 'Pengingat' },
    cell: ({ row }) =>
      row.original.lastRemindedAt ? (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.lastRemindedAt)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
]

const routeApi = getRouteApi('/_auth/invoices/')

export function InvoicesListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  const table = useTableQuery({ pageSize: 20 })
  const exportInvoices = useExportInvoices()
  const [isExporting, setIsExporting] = useState(false)
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null)

  // Status is a URL filter the table does not own — rewind to page 1 on change.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: InvoiceFilter = {
    status: status === 'all' ? undefined : status,
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useInvoicesList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // AR summary is a full-set server aggregate (ignores status/q/paging), so the
  // KPI cards + status tabs stay correct under any table filter.
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'paid', label: statusLabel('paid'), count: by?.paid },
    { value: 'pending', label: statusLabel('pending'), count: by?.pending },
    { value: 'overdue', label: statusLabel('overdue'), count: by?.overdue },
    { value: 'draft', label: statusLabel('draft'), count: by?.draft },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportInvoices(baseFilter)
      downloadCsv('tagihan', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan"
        description="Penagihan bulanan & piutang (AR)."
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
            <BillingActions />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {!summary ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="Total piutang (AR)"
              value={summary.outstanding}
              format={formatCurrency}
              hint={`${formatNumber(summary.unpaidCount)} tagihan belum bayar`}
              accent="amber"
              icon={WalletIcon}
            />
            <KpiCard
              label="Terlambat"
              value={summary.overdue}
              format={formatCurrency}
              hint="jatuh tempo terlewat"
              hintTone="negative"
              icon={TriangleAlertIcon}
            />
            <KpiCard
              label="Total tagihan"
              value={summary.total}
              hint="periode berjalan"
              icon={ReceiptTextIcon}
            />
          </>
        )}
      </div>

      <FilterTabs
        ariaLabel="Filter status tagihan"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(inv) => setOpenInvoiceId(inv.id)}
        emptyMessage={
          table.search ? `Tidak ada tagihan cocok dengan "${table.search}".` : 'Belum ada tagihan.'
        }
        searchPlaceholder="Cari tagihan…"
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
        enableSelection={canRemind}
        bulkActions={(selected) => {
          const unpaid = selected.filter(
            (inv) => inv.status === 'pending' || inv.status === 'overdue',
          )
          return (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={remind.isPending || unpaid.length === 0}
              onClick={() => remind.mutate(unpaid.map((inv) => inv.id))}
            >
              <BellRingIcon className="size-4" />
              Kirim pengingat ({unpaid.length})
            </Button>
          )
        }}
      />

      <InvoiceDetailSheet
        invoiceId={openInvoiceId}
        open={openInvoiceId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenInvoiceId(null)
        }}
      />
    </div>
  )
}
