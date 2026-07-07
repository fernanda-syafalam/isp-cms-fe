import { Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CoinsIcon,
  HandCoinsIcon,
  PercentIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'

import { ErrorState } from '@/components/shared/error-state'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { LedgerEntryType } from '@/schemas/reseller'

import { useReseller, useResellerCommissionTotal, useResellerLedger } from '../hooks/useResellers'
import { LedgerEntryDialog } from './LedgerEntryDialog'
import { PayoutDialog } from './PayoutDialog'
import { PayoutsCard } from './PayoutsCard'
import { ledgerColumns } from './resellerLedgerColumns'
import { ResellerCustomersCard } from './ResellerCustomersCard'

type Props = {
  resellerId: string
}

export function ResellerDetailPage({ resellerId }: Props) {
  const { data: reseller, isLoading, isError, refetch } = useReseller(resellerId)
  const table = useTableQuery({ pageSize: 20 })
  const ledger = useResellerLedger(resellerId, table.params)
  const canManage = useCan('resellers.manage')
  const [dialogType, setDialogType] = useState<LedgerEntryType | null>(null)
  const [payoutOpen, setPayoutOpen] = useState(false)

  // Real commission earned from the ledger (P3.D.1), replacing the old ARPU
  // estimate — the BE now posts a commission entry on each invoice payment.
  const { data: commissionTotal = 0 } = useResellerCommissionTotal(resellerId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !reseller) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState title="Reseller tidak ditemukan." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={reseller.name}
        description={`${reseller.area} · komisi ${formatPercent(reseller.commissionPct)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={reseller.status === 'active' ? 'success' : 'neutral'}
              label={statusLabel(reseller.status)}
            />
            {canManage ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setDialogType('topup')}>
                  <BanknoteIcon className="size-4" />
                  Top-up
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialogType('commission')}>
                  <CoinsIcon className="size-4" />
                  Catat komisi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPayoutOpen(true)}>
                  <HandCoinsIcon className="size-4" />
                  Ajukan pencairan
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Saldo deposit"
          value={reseller.balance}
          format={formatCurrency}
          hint="saldo berjalan"
          accent="amber"
          icon={WalletIcon}
        />
        <KpiCard
          label="Komisi"
          value={reseller.commissionPct}
          format={formatPercent}
          hint="per pendapatan"
          icon={PercentIcon}
        />
        <KpiCard
          label="Pelanggan"
          value={reseller.customerCount}
          format={formatNumber}
          hint="diregistrasi reseller"
          icon={UsersIcon}
        />
        <KpiCard
          label="Total komisi"
          value={commissionTotal}
          format={formatCurrency}
          hint="dari ledger pembayaran tagihan"
          icon={CoinsIcon}
        />
      </div>

      <ResellerCustomersCard resellerId={reseller.id} />

      <DataTable
        columns={ledgerColumns}
        data={ledger.data?.items}
        isLoading={ledger.isLoading}
        isError={ledger.isError}
        onRetry={() => ledger.refetch()}
        emptyMessage={
          table.search
            ? `Tidak ada transaksi cocok dengan "${table.search}".`
            : 'Belum ada transaksi.'
        }
        searchPlaceholder="Cari catatan…"
        server={{
          pageIndex: table.pageIndex,
          pageSize: table.pageSize,
          rowCount: ledger.data?.total ?? 0,
          sorting: table.sorting,
          search: table.search,
          onPaginationChange: table.onPaginationChange,
          onSortingChange: table.onSortingChange,
          onSearchChange: table.onSearchChange,
        }}
      />

      <PayoutsCard resellerId={reseller.id} canManage={canManage} />

      {dialogType ? (
        <LedgerEntryDialog
          resellerId={reseller.id}
          type={dialogType}
          open={dialogType !== null}
          onOpenChange={(open) => !open && setDialogType(null)}
          defaultAmount={0}
        />
      ) : null}

      <PayoutDialog
        resellerId={reseller.id}
        balance={reseller.balance}
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/resellers">
        <ArrowLeftIcon className="size-4" />
        Kembali ke reseller
      </Link>
    </Button>
  )
}
