import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { CustomerStatus } from '@/schemas/customer'

import { useCustomer } from '../hooks/useCustomers'

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  inactive: 'neutral',
}

const STATUS_LABEL: Record<CustomerStatus, string> = {
  active: 'Aktif',
  pending: 'Menunggu',
  suspended: 'Ditangguhkan',
  inactive: 'Nonaktif',
}

type Props = {
  customerId: string
}

export function CustomerDetailPage({ customerId }: Props) {
  const { data: customer, isLoading, isError } = useCustomer(customerId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Pelanggan tidak ditemukan.
        </p>
      </div>
    )
  }

  const fields: Array<{ label: string; value: string }> = [
    { label: 'No. Pelanggan', value: customer.customerNo },
    { label: 'Telepon', value: customer.phone },
    { label: 'Email', value: customer.email ?? '—' },
    { label: 'Alamat', value: customer.address },
    { label: 'Area', value: customer.areaName },
    { label: 'Paket', value: customer.planName },
    { label: 'Bergabung', value: formatDate(customer.joinedAt) },
  ]

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={customer.fullName}
        actions={
          <StatusBadge tone={STATUS_TONE[customer.status]} label={STATUS_LABEL[customer.status]} />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-muted-foreground text-xs">{f.label}</dt>
                <dd className="mt-0.5 text-sm">{f.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/customers">
        <ArrowLeftIcon className="size-4" />
        Kembali ke pelanggan
      </Link>
    </Button>
  )
}
