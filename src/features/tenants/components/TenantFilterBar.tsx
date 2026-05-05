import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TenantFilter } from '@/schemas/tenant'

type Props = {
  value: TenantFilter
  onChange: (next: TenantFilter) => void
}

const STATUS_OPTIONS = ['all', 'active', 'pending', 'suspended'] as const

export function TenantFilterBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Search by name or email…"
        value={value.q ?? ''}
        onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
        className="sm:max-w-xs"
        aria-label="Search tenants"
      />
      <Select
        value={value.status ?? 'all'}
        onValueChange={(next) =>
          onChange({
            ...value,
            status: next === 'all' ? undefined : (next as TenantFilter['status']),
            page: 1,
          })
        }
      >
        <SelectTrigger className="sm:w-44" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status === 'all' ? 'All statuses' : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
