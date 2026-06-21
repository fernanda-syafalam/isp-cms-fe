import { Link } from '@tanstack/react-router'

import { isRouteAllowed } from '@/components/shared/nav'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { useResellerCustomers } from '../hooks/useResellers'

const CUSTOMER_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

export function ResellerCustomersCard({ resellerName }: { resellerName: string }) {
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
