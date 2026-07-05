import { BanknoteIcon, CoinsIcon } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { KpiCard } from '@/components/shared/kpi-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'

import { useReconciliation } from '../hooks/usePayments'

const today = () => new Date().toISOString().slice(0, 10)

// End-of-day reconciliation (rekonsiliasi): pick a date and see per-method
// totals plus the cash-drawer summary (uang diterima / kembalian).
export function PaymentReconciliation() {
  const [date, setDate] = useState(today)
  const { data, isLoading, isError, refetch } = useReconciliation(date)

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recon-date">Tanggal</Label>
          <Input
            id="recon-date"
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !data ? (
        <ErrorState title="Gagal memuat rekonsiliasi." onRetry={() => refetch()} />
      ) : data.totalCount === 0 ? (
        <EmptyState
          title="Belum ada pembayaran pada tanggal ini."
          description="Pilih tanggal lain untuk melihat rekonsiliasi."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total diterima"
              value={formatCurrency(data.totalAmount)}
              hint={`${formatNumber(data.totalCount)} transaksi`}
              icon={BanknoteIcon}
            />
            <KpiCard
              label="Transaksi"
              value={data.totalCount}
              hint="pada tanggal ini"
              icon={CoinsIcon}
            />
            <KpiCard
              label="Uang diterima (tunai)"
              value={formatCurrency(data.cash.totalTendered)}
              hint="total tendered"
              icon={BanknoteIcon}
              accent="amber"
            />
            <KpiCard
              label="Kembalian (tunai)"
              value={formatCurrency(data.cash.totalChange)}
              hint="total change"
              icon={CoinsIcon}
              accent="amber"
            />
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah transaksi</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byMethod.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell>{statusLabel(row.method)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatNumber(row.count)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(row.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
