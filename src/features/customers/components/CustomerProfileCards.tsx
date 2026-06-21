import { CopyButton } from '@/components/shared/copy-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Customer } from '@/schemas/customer'

// "Ringkasan" tab — customer profile + subscription, side by side.

export function ProfileCard({ customer }: { customer: Customer }) {
  const fields: Array<{ label: string; value: string; copy?: boolean }> = [
    { label: 'Telepon', value: customer.phone, copy: true },
    { label: 'Email', value: customer.email ?? '—', copy: true },
    { label: 'Alamat', value: customer.address },
    { label: 'Area', value: customer.areaName ?? '—' },
    { label: 'NPWP', value: customer.npwp ?? '—', copy: true },
    { label: 'Reseller', value: customer.resellerName ?? '—' },
    { label: 'Bergabung', value: formatDate(customer.joinedAt) },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data pelanggan</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="flex items-center gap-1 text-right text-sm">
                {f.value}
                {f.copy && f.value !== '—' ? (
                  <CopyButton value={f.value} label={`${f.label} disalin`} />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export function SubscriptionCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Langganan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-xs">Paket</span>
          <span className="text-sm">{customer.planName}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-border border-t pt-3">
          <span className="text-muted-foreground text-xs">Piutang</span>
          <span
            className={`font-mono font-semibold text-sm tabular-nums ${
              customer.outstanding > 0 ? 'text-red-600 dark:text-red-400' : ''
            }`}
          >
            {formatCurrency(customer.outstanding)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
