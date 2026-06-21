import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { VoucherFilter } from '@/api/vouchers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'

import { useExportVouchers, useVouchersList } from '../hooks/useVouchers'
import { GenerateBatchDialog } from './GenerateBatchDialog'
import { voucherColumns, toCsvRow } from './vouchersColumns'
import { VouchersKpis } from './VouchersKpis'

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

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'unused', label: statusLabel('unused'), count: summary?.unused },
    { value: 'used', label: statusLabel('used'), count: summary?.used },
    {
      value: 'expired',
      label: statusLabel('expired'),
      count: summary?.expired,
    },
  ]

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

      <VouchersKpis summary={summary} />

      <FilterTabs
        ariaLabel="Filter status voucher"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={voucherColumns}
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
      />
    </div>
  )
}
