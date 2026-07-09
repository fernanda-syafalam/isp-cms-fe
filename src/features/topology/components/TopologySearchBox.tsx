import { useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, matchedField, nodeSearchText } from '../lib/graph'

const MAX_RESULTS = 8

type Props = {
  nodes: NetworkNode[]
  query: string
  onQueryChange: (q: string) => void
  /** Commit a result: the parent selects the node and flies the map to it. */
  onPick: (node: NetworkNode) => void
}

// Search box that actually takes you somewhere: typing filters the network and
// shows a results dropdown; picking a result selects the node and flies the map
// to it (see NetworkTopologyPage.onPick). cmdk gives keyboard nav (↑/↓/Enter)
// and combobox semantics for free; we filter ourselves over a shared haystack
// (name + id + customer phone / ONU serial / IP / PON / plan).
export function TopologySearchBox({ nodes, query, onQueryChange, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const q = query.trim().toLowerCase()
  const matches = q ? nodes.filter((n) => nodeSearchText(n).includes(q)).slice(0, MAX_RESULTS) : []
  const showList = open && q.length > 0

  return (
    <div className="relative w-full sm:max-w-xs">
      <Command shouldFilter={false} className="overflow-visible rounded-md border bg-transparent">
        <CommandInput
          value={query}
          onValueChange={onQueryChange}
          aria-label="Cari node topologi"
          placeholder="Cari nama, telepon, ONU, IP…"
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {showList ? (
          // preventDefault on mousedown keeps the input focused so the item's
          // onSelect fires before the blur-close race.
          <CommandList
            className="absolute top-full right-0 left-0 z-[1100] mt-1 rounded-md border bg-popover shadow-md"
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandEmpty>Tidak ada node yang cocok.</CommandEmpty>
            <CommandGroup>
              {matches.map((n) => {
                const hint = matchedField(n, q)
                return (
                  <CommandItem
                    key={n.id}
                    value={n.id}
                    onSelect={() => {
                      onPick(n)
                      setOpen(false)
                    }}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: STATUS_COLOR[n.status] }}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{n.name}</span>
                      {hint ? (
                        <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
                      ) : null}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                      {TYPE_LABEL[n.type]} · {STATUS_LABEL[n.status]}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        ) : null}
      </Command>
    </div>
  )
}
