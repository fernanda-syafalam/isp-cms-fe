import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { statusLabel } from '@/lib/status-label'

import { useCustomer } from '../hooks/useCustomers'
import { useCustomerInvoices } from '../hooks/useCustomerInvoices'
import { useCustomerTickets } from '../hooks/useCustomerTickets'
import {
  CustomerMapButton,
  CustomerNavigateButton,
  CustomerStatusAction,
  CustomerWhatsappButton,
} from './customer-actions'
import { ConnectionCard } from './CustomerConnectionCard'
import { InvoicesCard, TicketsCard } from './CustomerHistoryCards'
import { ProfileCard, SubscriptionCard } from './CustomerProfileCards'
import { CustomerRowActions } from './CustomerRowActions'
import { CustomerSummary } from './CustomerSummary'
import { CustomerTimeline } from './CustomerTimeline'
import { ContractTab } from '@/features/contracts'
import { PrivacyTab } from './PrivacyTab'

type Props = {
  customerId: string
}

export function CustomerDetailPage({ customerId }: Props) {
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId)
  const { data: invoices } = useCustomerInvoices(customerId)
  const { data: tickets } = useCustomerTickets(customer?.fullName)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState title="Pelanggan tidak ditemukan." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={customer.fullName}
        description={`${customer.customerNo} · ${customer.areaName ?? 'Tanpa area'}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={STATUS_TONE[customer.status]} label={statusLabel(customer.status)} />
            <CustomerMapButton customer={customer} />
            <CustomerNavigateButton customer={customer} />
            <CustomerWhatsappButton customerId={customer.id} />
            <CustomerStatusAction customer={customer} />
            <CustomerRowActions customer={customer} />
          </div>
        }
      />

      <CustomerSummary customer={customer} />

      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="aktivitas">Aktivitas</TabsTrigger>
          <TabsTrigger value="koneksi">Koneksi</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="tiket">Tiket</TabsTrigger>
          <TabsTrigger value="kontrak">Kontrak</TabsTrigger>
          <TabsTrigger value="privasi">Privasi</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkasan">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileCard customer={customer} />
            <SubscriptionCard customer={customer} />
          </div>
        </TabsContent>
        <TabsContent value="aktivitas">
          <CustomerTimeline customer={customer} invoices={invoices} tickets={tickets} />
        </TabsContent>
        <TabsContent value="koneksi">
          <ConnectionCard customerId={customer.id} connection={customer.connection} />
        </TabsContent>
        <TabsContent value="tagihan">
          <InvoicesCard invoices={invoices} />
        </TabsContent>
        <TabsContent value="tiket">
          <TicketsCard tickets={tickets} />
        </TabsContent>
        <TabsContent value="kontrak">
          <ContractTab customer={customer} />
        </TabsContent>
        <TabsContent value="privasi">
          <PrivacyTab customer={customer} invoices={invoices} tickets={tickets} />
        </TabsContent>
      </Tabs>
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
