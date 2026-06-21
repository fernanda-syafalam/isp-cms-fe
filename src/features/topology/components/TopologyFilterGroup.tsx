import { Button } from '@/components/ui/button'
import type { NodeStatus, NodeType } from '@/schemas/topology'

export const TYPE_FILTERS: Array<{ value: 'all' | NodeType; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'olt', label: 'OLT' },
  { value: 'odc', label: 'ODC' },
  { value: 'odp', label: 'ODP' },
  { value: 'pole', label: 'Tiang' },
  { value: 'customer', label: 'Pelanggan' },
]

export const STATUS_FILTERS: Array<{
  value: 'all' | NodeStatus
  label: string
}> = [
  { value: 'all', label: 'Semua' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'unknown', label: 'Unknown' },
]

type FilterGroupProps<T extends string> = {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  compact: boolean
}

// A labelled row of toggle buttons (e.g. Status / Tipe). `compact` shrinks the
// targets for the desktop card vs the 44px-tappable mobile sheet.
export function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  compact,
}: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-sm">{label}:</span>
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? 'default' : 'outline'}
          className={compact ? 'h-7 px-2.5' : 'h-11 px-4'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
