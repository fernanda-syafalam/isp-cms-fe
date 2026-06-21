import { getRouteApi } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { statusLabel } from '@/lib/status-label'

import { useApplySlaCredit, useSlaCredits, useVoidSlaCredit } from '../hooks/useSlaCredits'
import { SlaCreditFormDialog } from './SlaCreditFormDialog'
import { slaCreditColumns } from './slaCreditsColumns'
import { SlaCreditsKpis } from './SlaCreditsKpis'

const routeApi = getRouteApi('/_auth/sla-credits')

export function SlaCreditsPage() {
  const canManage = useCan('billing.run')
  const apply = useApplySlaCredit()
  const voidCredit = useVoidSlaCredit()
  // Deep-link prefill from a breached ticket: open the issue dialog pre-filled.
  const { customer, ticket, status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const [addOpen, setAddOpen] = useState(Boolean(customer))
  const table = useTableQuery({ pageSize: 20 })

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const { data, isLoading, isError, refetch } = useSlaCredits({
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // Full-set server aggregate (ignores q/sort/paging), so the KPI cards stay
  // correct under any table search.
  const summary = data?.summary

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    {
      value: 'pending',
      label: statusLabel('pending'),
      count: summary?.pending,
    },
    {
      value: 'applied',
      label: statusLabel('applied'),
      count: summary?.applied,
    },
    { value: 'void', label: statusLabel('void'), count: summary?.void },
  ]

  const columns = useMemo(
    () => slaCreditColumns({ canManage, apply, voidCredit }),
    [canManage, apply, voidCredit],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kredit SLA"
        description="Kompensasi pelanggan atas pelanggaran SLA / gangguan layanan."
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4" />
              Terbitkan kredit
            </Button>
          ) : null
        }
      />

      <SlaCreditsKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status kredit SLA"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage={
          table.search
            ? `Tidak ada kredit SLA cocok dengan "${table.search}".`
            : 'Belum ada kredit SLA.'
        }
        searchPlaceholder="Cari pelanggan / alasan…"
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

      {canManage ? (
        <SlaCreditFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          defaults={{
            ...(customer ? { customerName: customer } : {}),
            ...(ticket
              ? {
                  ticketCode: ticket,
                  reason: `Kompensasi pelanggaran SLA tiket ${ticket}`,
                }
              : {}),
          }}
        />
      ) : null}
    </div>
  )
}
