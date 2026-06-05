import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, PlugZapIcon, PowerOffIcon, UserPlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { CreateCustomerDialog } from './CreateCustomerDialog'
import { CustomerRowActions } from './CustomerRowActions'
import { useBulkCustomerStatus, useCustomersList } from '../hooks/useCustomers'

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
  Area: c.areaName,
  Paket: c.planName,
  Status: statusLabel(c.status),
  Bergabung: formatDate(c.joinedAt),
})

export function CustomersListPage() {
  const [status, setStatus] = useState<string>('all')
  const canManage = useCan('customers.manage')
  const canNetwork = useCan('network.manage')
  const bulkStatus = useBulkCustomerStatus()
  const { data, isLoading, isError } = useCustomersList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
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
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Pelanggan" description="Pelanggan dan paket aktif mereka." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada pelanggan."
        searchPlaceholder="Cari pelanggan…"
        enableSelection
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter status">
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
              disabled={!data?.items.length}
              onClick={() => downloadCsv('pelanggan', (data?.items ?? []).map(toCsvRow))}
            >
              <DownloadIcon className="size-4" />
              <span className="hidden sm:inline">Export</span>
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
