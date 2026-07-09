import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { SlaCredit, SlaCreditStatus } from '@/schemas/slaCredit'

import type { useApplySlaCredit, useVoidSlaCredit } from '../hooks/useSlaCredits'

const STATUS_TONE: Record<SlaCreditStatus, StatusTone> = {
  pending: 'warning',
  applied: 'success',
  void: 'neutral',
}

type ColumnOpts = {
  canManage: boolean
  apply: ReturnType<typeof useApplySlaCredit>
  voidCredit: ReturnType<typeof useVoidSlaCredit>
}

// Column factory (not a static const): the actions cell closes over the
// apply/void mutations and the permission flag, so the page memoizes the result.
export function slaCreditColumns({
  canManage,
  apply,
  voidCredit,
}: ColumnOpts): ColumnDef<SlaCredit>[] {
  return [
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
        return <SlaCreditRowActions credit={c} apply={apply} voidCredit={voidCredit} />
      },
    },
  ]
}

// Actions cell for a pending SLA credit. Both writes are financial, so each is
// gated behind a confirm dialog. Uses controlled AlertDialogs (the dropdown
// item closes the menu on select, so the dialog cannot live inside it).
function SlaCreditRowActions({
  credit,
  apply,
  voidCredit,
}: {
  credit: SlaCredit
  apply: ReturnType<typeof useApplySlaCredit>
  voidCredit: ReturnType<typeof useVoidSlaCredit>
}) {
  const [applyOpen, setApplyOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            Aksi
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setApplyOpen(true)}>
            <CheckIcon className="size-4" />
            Terapkan ke tagihan
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setVoidOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <XIcon className="size-4" />
            Batalkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={applyOpen} onOpenChange={setApplyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terapkan kredit ke tagihan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kredit SLA sebesar {formatCurrency(credit.amount)} untuk "{credit.customerName}" akan
              diterapkan ke tagihan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => apply.mutate(credit.id)}>Terapkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan kredit SLA?</AlertDialogTitle>
            <AlertDialogDescription>
              Kredit SLA sebesar {formatCurrency(credit.amount)} untuk "{credit.customerName}" akan
              dibatalkan dan tidak diterapkan ke tagihan. Tindakan ini tidak dapat dibalik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => voidCredit.mutate(credit.id)}>
              Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
