import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { customerStatusLabel } from '@/lib/status-label'

import { useReseller, useResellerCustomer } from '../hooks/useResellers'

type Props = {
  resellerId: string
  customerId: string
}

// Read-only customer detail scoped to a single reseller (P3.D.5). A mitra is
// confined to `/resellers`, so they cannot open the org-wide customer detail.
// This surface lives under `/resellers/$resellerId/customers/$customerId` —
// already inside the mitra allowlist by construction — and shows only the
// customer's own fields, with no billing/network/edit actions.
export function ResellerCustomerDetailPage({ resellerId, customerId }: Props) {
  const {
    data: reseller,
    isLoading: isResellerLoading,
    isError: isResellerError,
  } = useReseller(resellerId)
  const {
    data: customer,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    refetch,
  } = useResellerCustomer(resellerId, customerId)

  const isLoading = isResellerLoading || (Boolean(reseller) && isCustomerLoading)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Not one of this reseller's own customers (or the fetch failed) → not found.
  // This is where the FE scope is enforced for a mitra.
  if (isResellerError || isCustomerError || !reseller || !customer) {
    return (
      <div className="space-y-4">
        <BackLink resellerId={resellerId} />
        <ErrorState title="Pelanggan tidak ditemukan." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink resellerId={resellerId} />
      <PageHeader
        title={customer.fullName}
        description={`${customer.customerNo} · ${reseller.name}`}
        meta={
          <StatusBadge
            tone={customerStatusTone[customer.status]}
            label={customerStatusLabel(customer.status, customer.holdReason)}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor pelanggan" value={customer.customerNo} mono />
            <Field label="Nama lengkap" value={customer.fullName} />
            <Field label="Telepon" value={customer.phone} mono />
            <Field label="Paket layanan" value={customer.planName} />
            <Field label="Area layanan" value={customer.areaName} />
            <Field label="Reseller" value={customer.resellerName} />
            <Field label="Alamat" value={customer.address} full />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string | null
  mono?: boolean
  full?: boolean
}

function Field({ label, value, mono = false, full = false }: FieldProps) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? 'mt-0.5 font-mono text-sm' : 'mt-0.5 text-sm'}>{value ?? '—'}</dd>
    </div>
  )
}

function BackLink({ resellerId }: { resellerId: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/resellers/$resellerId" params={{ resellerId }}>
        <ArrowLeftIcon className="size-4" />
        Kembali ke reseller
      </Link>
    </Button>
  )
}
