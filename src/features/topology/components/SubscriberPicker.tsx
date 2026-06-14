import { useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/cn'
import type { Customer } from '@/schemas/customer'

const MAX_RESULTS = 8

type Props = {
  customers: Customer[]
  value: string | null
  onChange: (id: string) => void
}

// cmdk picker for choosing a subscriber to install (those without a topology
// node). Search by name or customer number.
export function SubscriberPicker({ customers, value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = (
    q
      ? customers.filter((c) => `${c.fullName} ${c.customerNo}`.toLowerCase().includes(q))
      : customers
  ).slice(0, MAX_RESULTS)

  return (
    // h-auto overrides the shadcn Command's default h-full, which would otherwise
    // stretch the picker to fill the dialog and push the footer over the form.
    <Command shouldFilter={false} className="h-auto rounded-md border">
      <CommandInput value={query} onValueChange={setQuery} placeholder="Cari pelanggan…" />
      <CommandList className="max-h-48">
        <CommandEmpty>Tidak ada pelanggan tanpa node.</CommandEmpty>
        <CommandGroup>
          {matches.map((c) => (
            <CommandItem
              key={c.id}
              value={c.id}
              onSelect={() => onChange(c.id)}
              className={cn(value === c.id && 'bg-accent')}
            >
              <span className="truncate">{c.fullName}</span>
              <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                {c.customerNo} · {c.planName}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
