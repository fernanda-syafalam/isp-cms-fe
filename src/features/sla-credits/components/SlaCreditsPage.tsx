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
import { formatCurrency, formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { SlaCredit, SlaCreditStatus } from '@/schemas/slaCredit'

import { useApplySlaCredit, useSlaCredits, useVoidSlaCredit } from '../hooks/useSlaCredits'
import { SlaCreditFormDialog } from './SlaCreditFormDialog'

const STATUS_TONE: Record<SlaCreditStatus, StatusTone> = {
  pending: 'warning',
  applied: 'success',
  void: 'neutral',
}

export function SlaCreditsPage() {
  const { data, isLoading, isError } = useSlaCredits()
  const canManage = useCan('billing.run')
  const apply = useApplySlaCredit()
  const voidCredit = useVoidSlaCredit()
  const [addOpen, setAddOpen] = useState(false)

  const summary = useMemo(() => {
    const items = data?.items ?? []
    const active = items.filter((c) => c.status !== 'void')
    return {
      total: active.reduce((s, c) => s + c.amount, 0),
      pending: items.filter((c) => c.status === 'pending').length,
      applied: items.filter((c) => c.status === 'applied').length,
    }
  }, [data])

  const columns = useMemo<ColumnDef<SlaCredit>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan' },
        cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
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
          row.original.ticketCode ? (
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
          value={summary.total}
          format={formatCurrency}
          icon={WalletIcon}
        />
        <KpiCard
          label="Menunggu"
          value={summary.pending}
          hint="belum diterapkan"
          hintTone="negative"
          icon={HandCoinsIcon}
        />
        <KpiCard label="Diterapkan" value={summary.applied} hintTone="positive" icon={CheckIcon} />
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada kredit SLA."
        searchPlaceholder="Cari pelanggan / alasan…"
      />

      {canManage ? <SlaCreditFormDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
    </div>
  )
}
