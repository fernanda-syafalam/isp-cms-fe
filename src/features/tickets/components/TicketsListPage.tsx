import { getRouteApi } from '@tanstack/react-router'
import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { TicketFilter } from '@/api/tickets'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'

import { useBulkResolveTickets, useExportTickets, useTicketsList } from '../hooks/useTickets'
import { CreateTicketDialog } from './CreateTicketDialog'
import { ticketColumns, toCsvRow } from './ticketsColumns'
import { TicketDetailSheet } from './TicketDetailSheet'
import { TicketsKpis } from './TicketsKpis'

const routeApi = getRouteApi('/_auth/tickets/')

export function TicketsListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canManage = useCan('tickets.manage')
  const table = useTableQuery({ pageSize: 20 })
  const bulkResolve = useBulkResolveTickets()
  const exportTickets = useExportTickets()
  const [isExporting, setIsExporting] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  // Status lives in the URL (deep-link); changing it rewinds to page 1.
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({ search: value === 'all' ? {} : { status: value } })
  }

  // The status filter drives the server query; search/sort/paging from the table.
  const baseFilter: TicketFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useTicketsList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'open', label: statusLabel('open'), count: by?.open },
    {
      value: 'in_progress',
      label: statusLabel('in_progress'),
      count: by?.in_progress,
    },
    { value: 'resolved', label: statusLabel('resolved'), count: by?.resolved },
    { value: 'breached', label: statusLabel('breached'), count: by?.breached },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportTickets(baseFilter)
      downloadCsv('tiket', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiket Dukungan"
        description="Keluhan pelanggan dan pelacakan SLA."
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
            <CreateTicketDialog />
          </>
        }
      />

      <TicketsKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status tiket"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={ticketColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(t) => setOpenTicketId(t.id)}
        emptyMessage="Belum ada tiket."
        searchPlaceholder="Cari tiket…"
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
        enableSelection
        bulkActions={(selected) => {
          const open = selected.filter((t) => t.status === 'open' || t.status === 'in_progress')
          return (
            <>
              {canManage && open.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={bulkResolve.isPending}
                  onClick={() => bulkResolve.mutate(open.map((t) => t.id))}
                >
                  <CheckCircle2Icon className="size-4" />
                  Tandai selesai ({open.length})
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => downloadCsv('tiket-terpilih', selected.map(toCsvRow))}
              >
                <DownloadIcon className="size-4" />
                Export terpilih
              </Button>
            </>
          )
        }}
      />

      <TicketDetailSheet
        ticketId={openTicketId}
        open={openTicketId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenTicketId(null)
        }}
      />
    </div>
  )
}
