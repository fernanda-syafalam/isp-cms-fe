import { getRouteApi, Navigate } from '@tanstack/react-router'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { ResellerFilter } from '@/api/resellers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan, useCurrentUser, useEffectiveRole } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'
import type { Reseller } from '@/schemas/reseller'

import { resolveMitraResellerId } from '../lib/demoReseller'
import { useExportResellers, useResellersList } from '../hooks/useResellers'
import { CreateResellerDialog } from './CreateResellerDialog'
import { resellerColumns, toCsvRow } from './resellersColumns'
import { ResellerDetailSheet } from './ResellerDetailSheet'
import { ResellersKpis } from './ResellersKpis'

const routeApi = getRouteApi('/_auth/resellers/')

export function ResellersListPage() {
  const role = useEffectiveRole()
  const { data: user } = useCurrentUser()
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportResellers = useExportResellers()
  const [isExporting, setIsExporting] = useState(false)
  const [openReseller, setOpenReseller] = useState<Reseller | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const canManage = useCan('resellers.manage')

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: ResellerFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  // A mitra is redirected to their own storefront below and must never fetch the
  // admin/staff-only org-wide list — that GET /v1/resellers returns 403.
  const { data, isLoading, isError, refetch } = useResellersList(
    {
      ...baseFilter,
      limit: table.params.limit,
      offset: table.params.offset,
    },
    { enabled: role !== 'mitra' },
  )
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'active', label: statusLabel('active'), count: by?.active },
    { value: 'inactive', label: statusLabel('inactive'), count: by?.inactive },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportResellers(baseFilter)
      downloadCsv('reseller', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  // A partner (mitra) only sees their own storefront, not the org-wide table.
  // Their identity is the resellerId on their own account (P1.5) — never a
  // stand-in record. An unlinked mitra has no storefront to show. In a dev build
  // the demo role switcher has no resellerId, so resolveMitraResellerId falls
  // back to a seeded storefront (DEV-only; the guard below is intact in prod).
  if (role === 'mitra') {
    const resellerId = resolveMitraResellerId(role, user?.resellerId)
    if (resellerId) {
      return <Navigate to="/resellers/$resellerId" params={{ resellerId }} replace />
    }
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Akun mitra Anda belum tertaut ke data reseller. Hubungi admin.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller"
        description="Mitra loket/agen dan saldo komisinya."
        actions={
          <div className="flex items-center gap-2">
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
              <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Tambah reseller</span>
              </Button>
            ) : null}
          </div>
        }
      />

      <ResellersKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status reseller"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={resellerColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(r) => setOpenReseller(r)}
        emptyMessage="Belum ada reseller."
        searchPlaceholder="Cari reseller…"
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

      <ResellerDetailSheet
        reseller={openReseller}
        open={openReseller !== null}
        onOpenChange={(open) => {
          if (!open) setOpenReseller(null)
        }}
      />

      <CreateResellerDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
