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
import { cn } from '@/lib/cn'

import { useBranches } from '../hooks/useBranches'
import { useBranchScope } from '../store/branchScope'

type Props = {
  /**
   * `button` (default) is the compact top-bar control; `card` is the
   * full-width workspace switcher shown near the top of the sidebar.
   */
  variant?: 'button' | 'card'
}

// Control for the active branch scope. Persists the choice; modules filter by
// it as they become branch-aware.
export function BranchScopeSwitcher({ variant = 'button' }: Props) {
  const branchesQuery = useBranches()
  const data = branchesQuery.data
  const { scope, setScope } = useBranchScope()
  const label = scope?.name ?? 'Semua Cabang'
  const count = data?.items.length ?? 0
  const subtitle = scope ? 'Cabang terpilih' : count > 0 ? `${count} cabang` : 'Seluruh jaringan'
  const isCard = variant === 'card'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCard ? (
          <button
            type="button"
            aria-label="Pilih cakupan cabang"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none transition-colors',
              'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
              <Building2Icon className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium text-sm">{label}</span>
              <span className="truncate text-muted-foreground text-xs">{subtitle}</span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-1.5" aria-label="Pilih cabang">
            <Building2Icon className="size-4" />
            <span className="hidden max-w-32 truncate sm:inline">{label}</span>
            <ChevronsUpDownIcon className="size-3.5 opacity-60" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={isCard ? 'min-w-56' : 'w-56'}>
        <DropdownMenuLabel>Cakupan cabang</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setScope(null)}>
          {scope ? <span className="size-4" /> : <CheckIcon className="size-4" />}
          Semua cabang
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {branchesQuery.isLoading ? (
          <DropdownMenuItem disabled>Memuat cabang…</DropdownMenuItem>
        ) : branchesQuery.isError ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault()
              branchesQuery.refetch()
            }}
          >
            Gagal memuat cabang. Coba lagi.
          </DropdownMenuItem>
        ) : data && data.items.length > 0 ? (
          data.items.map((b) => (
            <DropdownMenuItem key={b.id} onSelect={() => setScope({ id: b.id, name: b.name })}>
              {scope?.id === b.id ? <CheckIcon className="size-4" /> : <span className="size-4" />}
              <span className="truncate">{b.name}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>Belum ada cabang</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
