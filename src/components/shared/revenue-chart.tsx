import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCurrency, formatCurrencyCompact } from '@/lib/format'

type Point = {
  month: string
  revenue: number
}

type Props = {
  data: Point[]
}

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => formatCurrencyCompact(value)}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Pendapatan']}
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-popover-foreground)',
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
