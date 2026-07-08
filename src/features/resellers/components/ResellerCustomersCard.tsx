import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { isRouteAllowed } from '@/components/shared/nav'
import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone as CUSTOMER_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer } from '@/schemas/customer'

import { RESELLER_ROSTER_PAGE_SIZE, useResellerCustomers } from '../hooks/useResellers'

export function ResellerCustomersCard({ resellerId }: { resellerId: string }) {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useResellerCustomers(resellerId, page)
  // admin/staff open the org-wide customer detail; a mitra (scoped to
  // `/resellers`) instead opens the read-only, reseller-scoped detail so the
  // name is never a dead-end (P3.D.5).
  const canOpenOrgCustomer = isRouteAllowed(useEffectiveRole(), '/customers')

  // `total` is the reseller's full roster size (before paging), so the header
  // count matches the KPI `customerCount` even when a page is truncated.
  const total = data?.total ?? 0
  const customers = data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(total / RESELLER_ROSTER_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : page * RESELLER_ROSTER_PAGE_SIZE + 1
  const rangeEnd = page * RESELLER_ROSTER_PAGE_SIZE + customers.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Pelanggan reseller
          {data ? ` (${formatNumber(total)})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : customers.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Belum ada pelanggan dari reseller ini.
          </p>
        ) : (
          <>
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
            {total > RESELLER_ROSTER_PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between gap-3 text-muted-foreground text-xs">
                <span>
                  Menampilkan {formatNumber(rangeStart)}–{formatNumber(rangeEnd)} dari{' '}
                  {formatNumber(total)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
