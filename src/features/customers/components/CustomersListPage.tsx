import { getRouteApi, Link } from '@tanstack/react-router'
import { DownloadIcon, UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { CustomerFilter } from '@/api/customers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { scopeAreas, useBranchScope } from '@/features/branches'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'

import { useBulkCustomerStatus, useCustomersList, useExportCustomers } from '../hooks/useCustomers'
import { CreateCustomerDialog } from './CreateCustomerDialog'
import { CustomerDetailSheet } from './CustomerDetailSheet'
import { customerColumns, STATUS_LABEL, toCsvRow } from './customersColumns'
import { CustomersBulkActions } from './CustomersBulkActions'
import { CustomersKpis } from './CustomersKpis'
import { SavedViews } from './SavedViews'

const routeApi = getRouteApi('/_auth/customers/')

export function CustomersListPage() {
  const canManage = useCan('customers.manage')
  const canNetwork = useCan('network.manage')
  const bulkStatus = useBulkCustomerStatus()
  const scope = useBranchScope((s) => s.scope)
  const table = useTableQuery({ pageSize: 20 })
  const exportCustomers = useExportCustomers()
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const [isExporting, setIsExporting] = useState(false)
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null)

  // Status is a URL filter (deep-linkable/bookmarkable); changing it rewinds to
  // page 1 so the user is never stranded on an out-of-range page.
  const setStatusFilter = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
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
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'aktif', label: STATUS_LABEL.aktif, count: by?.aktif },
    { value: 'isolir', label: STATUS_LABEL.isolir, count: by?.isolir },
    { value: 'instalasi', label: STATUS_LABEL.instalasi, count: by?.instalasi },
    { value: 'prospek', label: STATUS_LABEL.prospek, count: by?.prospek },
    { value: 'berhenti', label: STATUS_LABEL.berhenti, count: by?.berhenti },
  ]

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
      />

      <CustomersKpis summary={summary} isLoading={isLoading} isError={isError} />

      <div className="flex items-center justify-between gap-3">
        <FilterTabs
          ariaLabel="Filter status pelanggan"
          value={status}
          onValueChange={setStatusFilter}
          items={statusTabs}
        />
        <SavedViews
          status={status}
          q={table.search}
          onApply={(view) => {
            navigate({
              search: view.status === 'all' ? {} : { status: view.status },
            })
            table.onSearchChange(view.q)
            table.resetPage()
          }}
        />
      </div>

      <DataTable
        columns={customerColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(c) => setOpenCustomerId(c.id)}
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
        bulkActions={(selected) => (
          <CustomersBulkActions
            selected={selected}
            canNetwork={canNetwork}
            bulkStatus={bulkStatus}
          />
        )}
      />

      <CustomerDetailSheet
        customerId={openCustomerId}
        open={openCustomerId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenCustomerId(null)
        }}
      />
    </div>
  )
}
