import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  data: Array<{ label: string; count: number }> | undefined
}

// Horizontal bar chart of subscriber lifecycle composition (prospek → berhenti).
export function CustomerCompositionChart({ data }: Props) {
  if (!data) return <Skeleton className="h-[280px] w-full" />
  return (
    <ResponsiveContainer width="100%" height={280}>
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
          width={80}
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
        <Bar dataKey="count" name="Pelanggan" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
