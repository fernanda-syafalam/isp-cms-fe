import { RouterIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { RevenueChart } from '@/components/shared/revenue-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { DashboardSummary } from '@/schemas/analytics'

// The dashboard's analytics visualisations: revenue trend + network status,
// customer mix + AR aging, and tickets-by-status. Rendered as a fragment so
// each row stays a direct child of the page's vertical stack.
export function DashboardCharts({ summary }: { summary: DashboardSummary | undefined }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan (6 bulan terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <RevenueChart data={summary.revenueTrend} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status jaringan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <NetworkStatus online={summary.devicesOnline} total={summary.devicesTotal} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Komposisi pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <CustomerMix mix={summary.customerMix} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Umur piutang (AR aging)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <ArAging data={summary.arAging} />
            ) : (
              <Skeleton className="h-[220px] w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiket per status</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <TicketsByStatusChart data={summary.ticketsByStatus} />
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </CardContent>
      </Card>
    </>
  )
}

const MIX_COLOR: Record<string, string> = {
  Prospek: 'bg-slate-400',
  Instalasi: 'bg-blue-500',
  Aktif: 'bg-green-500',
  Isolir: 'bg-red-500',
  Berhenti: 'bg-zinc-500',
}

function CustomerMix({ mix }: { mix: Array<{ label: string; count: number }> }) {
  const total = mix.reduce((s, m) => s + m.count, 0) || 1
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {mix.map((m) =>
          m.count > 0 ? (
            <div
              key={m.label}
              className={MIX_COLOR[m.label] ?? 'bg-primary'}
              style={{ width: `${(m.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {mix.map((m) => (
          <li key={m.label} className="flex items-center gap-2">
            <span
              className={`size-2.5 shrink-0 rounded-full ${MIX_COLOR[m.label] ?? 'bg-primary'}`}
            />
            <span className="text-muted-foreground">{m.label}</span>
            <span className="ml-auto font-mono tabular-nums">{formatNumber(m.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArAging({ data }: { data: Array<{ bucket: string; amount: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="bucket"
          interval={0}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={48}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => formatCurrency(Number(v))}
          cursor={{ fill: 'var(--color-muted)' }}
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-popover-foreground)',
          }}
        />
        <Bar dataKey="amount" name="Piutang" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function TicketsByStatusChart({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)' }}
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-popover-foreground)',
          }}
        />
        <Bar dataKey="count" name="Tiket" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function NetworkStatus({ online, total }: { online: number; total: number }) {
  const offline = Math.max(0, total - online)
  const ratio = total > 0 ? online / total : 0
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RouterIcon className="size-5" />
        </span>
        <div>
          <p className="font-bold text-2xl tracking-tight">{formatPercent(ratio)}</p>
          <p className="text-muted-foreground text-xs">perangkat online</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Online</dt>
          <dd className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatNumber(online)}
          </dd>
        </div>
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Offline</dt>
          <dd className="font-medium text-red-600 dark:text-red-400">{formatNumber(offline)}</dd>
        </div>
      </dl>
    </div>
  )
}
