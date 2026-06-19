import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, PlugZapIcon, PowerOffIcon, UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { CustomerFilter } from '@/api/customers'
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
import { useCan } from '@/features/auth'
import { scopeAreas, useBranchScope } from '@/features/branches'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { CreateCustomerDialog } from './CreateCustomerDialog'
import { CustomerRowActions } from './CustomerRowActions'
import { useBulkCustomerStatus, useCustomersList, useExportCustomers } from '../hooks/useCustomers'

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

const STATUS_LABEL: Record<CustomerStatus, string> = {
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir',
  berhenti: 'Berhenti',
}

const STATUS_OPTIONS = ['all', 'aktif', 'isolir', 'instalasi', 'prospek', 'berhenti'] as const

const toCsvRow = (c: Customer) => ({
  No: c.customerNo,
  Nama: c.fullName,
  Telepon: c.phone,
  Area: c.areaName ?? '',
  Paket: c.planName,
  Status: statusLabel(c.status),
  Bergabung: formatDate(c.joinedAt),
})

// Static column defs (no component state). Sortable keys (customerNo/fullName/
// areaName/status/joinedAt) match the backend sort whitelist; phone is plain.
const COLUMNS: ColumnDef<Customer>[] = [
  {
    accessorKey: 'customerNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="No." />,
    meta: { title: 'No.' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.customerNo}</span>,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    meta: { title: 'Nama' },
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.fullName}
      </Link>
    ),
  },
  { accessorKey: 'phone', header: 'Telepon', meta: { title: 'Telepon' } },
  {
    accessorKey: 'areaName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
    meta: { title: 'Area' },
    cell: ({ row }) => row.original.areaName ?? <span className="text-muted-foreground">—</span>,
  },
  { accessorKey: 'planName', header: 'Paket', meta: { title: 'Paket' } },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={STATUS_LABEL[row.original.status]}
      />
    ),
  },
  {
    accessorKey: 'joinedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bergabung" />,
    meta: { title: 'Bergabung' },
    cell: ({ row }) => formatDate(row.original.joinedAt),
  },
  {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <CustomerRowActions customer={row.original} />,
  },
]

export function CustomersListPage() {
  const canManage = useCan('customers.manage')
  const canNetwork = useCan('network.manage')
  const bulkStatus = useBulkCustomerStatus()
  const scope = useBranchScope((s) => s.scope)
  const table = useTableQuery({ pageSize: 20 })
  const exportCustomers = useExportCustomers()
  const [status, setStatus] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)

  // Status is a local filter the table does not own — rewind to page 1 on change
  // so the user is never stranded on an out-of-range page.
  const setStatusFilter = (value: string) => {
    setStatus(value)
    table.resetPage()
  }

  // The branch scope is owned by a global switcher, not this page. When it
  // changes, the result set changes too, so reset to the first page (React's
  // sanctioned "adjust state during render" pattern keyed on the scope id).
  const [prevScopeId, setPrevScopeId] = useState<string | null>(scope?.id ?? null)
  if ((scope?.id ?? null) !== prevScopeId) {
    setPrevScopeId(scope?.id ?? null)
    table.resetPage()
  }

  const baseFilter: CustomerFilter = {
    status: status === 'all' ? undefined : status,
    area: scopeAreas(scope) ?? undefined,
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useCustomersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportCustomers(baseFilter)
      downloadCsv('pelanggan', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan"
        description={
          scope
            ? `Pelanggan & paket aktif — cabang ${scope.name}.`
            : 'Pelanggan dan paket aktif mereka.'
        }
      />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage={
          table.search
            ? `Tidak ada pelanggan cocok dengan "${table.search}".`
            : 'Belum ada pelanggan.'
        }
        searchPlaceholder="Cari pelanggan…"
        enableSelection
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
          <Select value={status} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full sm:h-8 sm:w-40" aria-label="Filter status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? 'Semua status' : STATUS_LABEL[s]}
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
            {canManage ? (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link to="/customers/onboarding">
                  <UserPlusIcon className="size-4" />
                  <span className="hidden sm:inline">Onboarding</span>
                </Link>
              </Button>
            ) : null}
            {canManage ? <CreateCustomerDialog /> : null}
          </>
        }
        bulkActions={(selected) => {
          const toIsolate = selected.filter((c) => c.status === 'aktif')
          const toActivate = selected.filter((c) => c.status === 'isolir')
          return (
            <>
              {canNetwork && toIsolate.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-destructive"
                  disabled={bulkStatus.isPending}
                  onClick={() =>
                    bulkStatus.mutate({
                      ids: toIsolate.map((c) => c.id),
                      action: 'isolate',
                    })
                  }
                >
                  <PowerOffIcon className="size-4" />
                  Isolir ({toIsolate.length})
                </Button>
              ) : null}
              {canNetwork && toActivate.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={bulkStatus.isPending}
                  onClick={() =>
                    bulkStatus.mutate({
                      ids: toActivate.map((c) => c.id),
                      action: 'activate',
                    })
                  }
                >
                  <PlugZapIcon className="size-4" />
                  Aktifkan ({toActivate.length})
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => downloadCsv('pelanggan-terpilih', selected.map(toCsvRow))}
              >
                <DownloadIcon className="size-4" />
                Export terpilih
              </Button>
            </>
          )
        }}
      />
    </div>
  )
}
