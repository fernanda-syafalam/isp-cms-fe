import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useBranches } from '../hooks/useBranches'
import { useBranchScope } from '../store/branchScope'

// Topbar control for the active branch scope. Persists the choice; modules
// filter by it as they become branch-aware.
export function BranchScopeSwitcher() {
  const { data } = useBranches()
  const { scope, setScope } = useBranchScope()
  const label = scope?.name ?? 'Semua cabang'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" aria-label="Pilih cabang">
          <Building2Icon className="size-4" />
          <span className="hidden max-w-32 truncate sm:inline">{label}</span>
          <ChevronsUpDownIcon className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Cakupan cabang</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setScope(null)}>
          {scope ? <span className="size-4" /> : <CheckIcon className="size-4" />}
          Semua cabang
        </DropdownMenuItem>
        {data && data.items.length > 0 ? <DropdownMenuSeparator /> : null}
        {data?.items.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => setScope({ id: b.id, name: b.name })}>
            {scope?.id === b.id ? <CheckIcon className="size-4" /> : <span className="size-4" />}
            <span className="truncate">{b.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
