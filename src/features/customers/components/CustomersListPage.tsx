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
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  inactive: 'neutral',
}

const STATUS_OPTIONS = ['all', 'active', 'pending', 'suspended', 'inactive'] as const

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
        header: 'Name',
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
      { accessorKey: 'phone', header: 'Phone' },
      { accessorKey: 'areaName', header: 'Area' },
      { accessorKey: 'planName', header: 'Plan' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]} label={row.original.status} />
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => formatDate(row.original.joinedAt),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Subscribers and their active plans."
        actions={<CreateCustomerDialog />}
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search by name or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
            aria-label="Search customers"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? 'All statuses' : s}
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
          emptyMessage="No customers yet."
        />
        <p className="text-muted-foreground text-sm">{data ? `${data.total} customers` : ''}</p>
      </div>
    </div>
  )
}
