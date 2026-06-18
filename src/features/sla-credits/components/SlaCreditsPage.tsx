import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckIcon, HandCoinsIcon, PlusIcon, WalletIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { SlaCredit, SlaCreditStatus } from '@/schemas/slaCredit'

import { useApplySlaCredit, useSlaCredits, useVoidSlaCredit } from '../hooks/useSlaCredits'
import { SlaCreditFormDialog } from './SlaCreditFormDialog'

const routeApi = getRouteApi('/_auth/sla-credits')

const STATUS_TONE: Record<SlaCreditStatus, StatusTone> = {
  pending: 'warning',
  applied: 'success',
  void: 'neutral',
}

export function SlaCreditsPage() {
  const canManage = useCan('billing.run')
  const apply = useApplySlaCredit()
  const voidCredit = useVoidSlaCredit()
  // Deep-link prefill from a breached ticket: open the issue dialog pre-filled.
  const { customer, ticket } = routeApi.useSearch()
  const [addOpen, setAddOpen] = useState(Boolean(customer))
  const table = useTableQuery({ pageSize: 20 })

  const { data, isLoading, isError } = useSlaCredits({
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

  const columns = useMemo<ColumnDef<SlaCredit>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan' },
        cell: ({ row }) =>
          row.original.customerId ? (
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.original.customerId }}
              className="font-medium hover:underline"
            >
              {row.original.customerName}
            </Link>
          ) : (
            <span className="font-medium">{row.original.customerName}</span>
          ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nominal" />,
        meta: { title: 'Nominal', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatCurrency(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Alasan',
        meta: { title: 'Alasan' },
        cell: ({ row }) => <span className="text-sm">{row.original.reason}</span>,
      },
      {
        accessorKey: 'ticketCode',
        header: 'Tiket',
        meta: { title: 'Tiket' },
        cell: ({ row }) =>
          row.original.ticketCode && row.original.ticketId ? (
            <Link
              to="/tickets/$ticketId"
              params={{ ticketId: row.original.ticketId }}
              className="font-mono text-xs hover:underline"
            >
              {row.original.ticketCode}
            </Link>
          ) : row.original.ticketCode ? (
            <span className="font-mono text-xs">{row.original.ticketCode}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        meta: { title: 'Tanggal' },
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) => {
          const c = row.original
          if (!canManage || c.status !== 'pending') return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  Aksi
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => apply.mutate(c.id)}>
                  <CheckIcon className="size-4" />
                  Terapkan ke tagihan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => voidCredit.mutate(c.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <XIcon className="size-4" />
                  Batalkan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
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

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total kredit aktif"
          value={summary?.activeAmount ?? 0}
          format={formatCurrency}
          icon={WalletIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Menunggu"
          value={summary?.pending ?? 0}
          hint="belum diterapkan"
          hintTone="negative"
          icon={HandCoinsIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Diterapkan"
          value={summary?.applied ?? 0}
          hintTone="positive"
          icon={CheckIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
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
