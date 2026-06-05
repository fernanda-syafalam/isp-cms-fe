import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/format'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { CreateCustomerDialog } from './CreateCustomerDialog'
import { useCustomersList } from '../hooks/useCustomers'

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

export function CustomersListPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('all')
  const { data, isLoading, isError } = useCustomersList({
    q: q || undefined,
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      { accessorKey: 'customerNo', header: 'No.' },
      {
        accessorKey: 'fullName',
        header: 'Nama',
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
      { accessorKey: 'phone', header: 'Telepon' },
      { accessorKey: 'areaName', header: 'Area' },
      { accessorKey: 'planName', header: 'Paket' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={STATUS_LABEL[row.original.status]}
          />
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: 'Bergabung',
        cell: ({ row }) => formatDate(row.original.joinedAt),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelanggan"
        description="Pelanggan dan paket aktif mereka."
        actions={<CreateCustomerDialog />}
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Cari nama atau nomor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
            aria-label="Cari pelanggan"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44" aria-label="Filter status">
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
        </div>
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada pelanggan."
        />
        <p className="text-muted-foreground text-sm">{data ? `${data.total} pelanggan` : ''}</p>
      </div>
    </div>
  )
}
