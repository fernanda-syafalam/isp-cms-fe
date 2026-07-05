import { Link } from '@tanstack/react-router'

import { isRouteAllowed } from '@/components/shared/nav'
import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone as CUSTOMER_TONE } from '@/components/shared/status-tone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer } from '@/schemas/customer'

import { useResellerCustomers } from '../hooks/useResellers'

export function ResellerCustomersCard({
  resellerId,
  resellerName,
}: {
  resellerId: string
  resellerName: string
}) {
  const { data: customers, isLoading } = useResellerCustomers(resellerName)
  // admin/staff open the org-wide customer detail; a mitra (scoped to
  // `/resellers`) instead opens the read-only, reseller-scoped detail so the
  // name is never a dead-end (P3.D.5).
  const canOpenOrgCustomer = isRouteAllowed(useEffectiveRole(), '/customers')
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
                  {canOpenOrgCustomer ? (
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: c.id }}
                      className="min-w-0 hover:underline"
                    >
                      {info}
                    </Link>
                  ) : (
                    <Link
                      to="/resellers/$resellerId/customers/$customerId"
                      params={{ resellerId, customerId: c.id }}
                      className="min-w-0 hover:underline"
                    >
                      {info}
                    </Link>
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
