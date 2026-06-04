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
          Customer not found.
        </p>
      </div>
    )
  }

  const fields: Array<{ label: string; value: string }> = [
    { label: 'Customer No.', value: customer.customerNo },
    { label: 'Phone', value: customer.phone },
    { label: 'Email', value: customer.email ?? '—' },
    { label: 'Address', value: customer.address },
    { label: 'Area', value: customer.areaName },
    { label: 'Plan', value: customer.planName },
    { label: 'Joined', value: formatDate(customer.joinedAt) },
  ]

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={customer.fullName}
        actions={<StatusBadge tone={STATUS_TONE[customer.status]} label={customer.status} />}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriber details</CardTitle>
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
        Back to customers
      </Link>
    </Button>
  )
}
