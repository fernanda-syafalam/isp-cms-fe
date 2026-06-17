import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CoinsIcon,
  PercentIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isRouteAllowed } from '@/components/shared/nav'
import { useCan, useEffectiveRole } from '@/features/auth'
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'
import type { LedgerEntry, LedgerEntryType } from '@/schemas/reseller'

import { useReseller, useResellerCustomers, useResellerLedger } from '../hooks/useResellers'
import { LedgerEntryDialog } from './LedgerEntryDialog'

const CUSTOMER_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

// Representative ARPU used to estimate a reseller's monthly commission from
// their customer count and commission rate (mock — real systems sum invoices).
const ARPU = 250_000

const LEDGER_TONE: Record<LedgerEntryType, StatusTone> = {
  topup: 'info',
  commission: 'success',
  deduction: 'warning',
  withdrawal: 'neutral',
}

type Props = {
  resellerId: string
}

export function ResellerDetailPage({ resellerId }: Props) {
  const { data: reseller, isLoading, isError } = useReseller(resellerId)
  const ledger = useResellerLedger(resellerId)
  const canManage = useCan('resellers.manage')
  const [dialogType, setDialogType] = useState<LedgerEntryType | null>(null)

  const estimatedCommission = reseller
    ? Math.round(reseller.customerCount * ARPU * reseller.commissionPct)
    : 0

  const columns = useMemo<ColumnDef<LedgerEntry>[]>(
    () => [
      {
        accessorKey: 'at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        meta: { title: 'Tanggal' },
        cell: ({ row }) => formatDateTime(row.original.at),
      },
      {
        accessorKey: 'type',
        header: 'Tipe',
        meta: { title: 'Tipe' },
        cell: ({ row }) => (
          <StatusBadge
            tone={LEDGER_TONE[row.original.type]}
            label={statusLabel(row.original.type)}
          />
        ),
      },
      { accessorKey: 'note', header: 'Catatan', meta: { title: 'Catatan' } },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
        meta: { title: 'Jumlah', align: 'right' },
        cell: ({ row }) => {
          const positive = row.original.amount >= 0
          return (
            <span
              className={`font-mono tabular-nums ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {positive ? '+' : '−'}
              {formatCurrency(Math.abs(row.original.amount))}
            </span>
          )
        },
      },
      {
        accessorKey: 'balanceAfter',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
        meta: { title: 'Saldo', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(row.original.balanceAfter)}
          </span>
        ),
      },
    ],
    [],
  )

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
        <p className="text-destructive" role="alert">
          Reseller tidak ditemukan.
        </p>
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
                <Button variant="outline" size="sm" onClick={() => setDialogType('withdrawal')}>
                  <WalletIcon className="size-4" />
                  Tarik saldo
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
          label="Estimasi komisi / bulan"
          value={estimatedCommission}
          format={formatCurrency}
          hint="perkiraan dari basis pelanggan"
          icon={CoinsIcon}
        />
      </div>

      <ResellerCustomersCard resellerName={reseller.name} />

      <DataTable
        columns={columns}
        data={ledger.data?.items}
        isLoading={ledger.isLoading}
        isError={ledger.isError}
        emptyMessage="Belum ada transaksi."
        searchPlaceholder="Cari catatan…"
      />

      {dialogType ? (
        <LedgerEntryDialog
          resellerId={reseller.id}
          type={dialogType}
          open={dialogType !== null}
          onOpenChange={(open) => !open && setDialogType(null)}
          defaultAmount={dialogType === 'commission' ? estimatedCommission : 0}
        />
      ) : null}
    </div>
  )
}

function ResellerCustomersCard({ resellerName }: { resellerName: string }) {
  const { data: customers, isLoading } = useResellerCustomers(resellerName)
  // A partner (mitra) can't open the customer detail page (not in their
  // allowlist) — show names as plain text so they don't bounce off the guard.
  const canOpenCustomer = isRouteAllowed(useEffectiveRole(), '/customers')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Pelanggan reseller
          {customers ? ` (${formatNumber(customers.length)})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !customers || customers.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Belum ada pelanggan dari reseller ini.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c: Customer) => {
              const info = (
                <>
                  <span className="block truncate font-medium text-sm">{c.fullName}</span>
                  <span className="font-mono text-muted-foreground text-xs">
                    {c.customerNo} · {c.areaName ?? '—'}
                  </span>
                </>
              )
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  {canOpenCustomer ? (
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: c.id }}
                      className="min-w-0 hover:underline"
                    >
                      {info}
                    </Link>
                  ) : (
                    <div className="min-w-0">{info}</div>
                  )}
                  <StatusBadge tone={CUSTOMER_TONE[c.status]} label={statusLabel(c.status)} />
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
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
