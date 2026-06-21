import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import type { ReportsSummary } from '@/schemas/analytics'

type Props = {
  data: ReportsSummary['movement'] | undefined
}

// Monthly subscriber movement: new additions vs. churn, grouped bars.
export function MovementChart({ data }: Props) {
  if (!data) return <Skeleton className="h-[280px] w-full" />
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-popover-foreground)',
          }}
        />
        <Legend />
        <Bar dataKey="added" name="Baru" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="churned" name="Churn" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
