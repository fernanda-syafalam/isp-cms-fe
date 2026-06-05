import { useId } from 'react'

import { cn } from '@/lib/cn'

type Props = {
  data: number[]
  className?: string
}

// Lightweight inline-SVG sparkline (no chart lib → no bundle cost). Colour comes
// from `currentColor`; size from CSS (set height via className, width stretches).
export function Sparkline({ data, className }: Props) {
  const gradientId = useId()
  if (data.length < 2) return null

  const w = 100
  const h = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)

  const points = data.map((d, i) => {
    const x = i * step
    const y = h - ((d - min) / range) * (h - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const line = `M${points.join(' L')}`
  const area = `${line} L${w},${h} L0,${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
