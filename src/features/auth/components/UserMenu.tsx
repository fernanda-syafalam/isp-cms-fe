import { useNavigate } from '@tanstack/react-router'
import { ChevronsUpDownIcon, LogOutIcon, RotateCcwIcon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'

import { resetMockData } from '@/api/dev'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/cn'

import { ROLE_LABEL, ROLES, isRole } from '@/lib/permissions'

import { useCurrentUser, useLogout } from '../hooks/useAuth'
import { useCan, useEffectiveRole } from '../hooks/useRole'
import { useRoleStore } from '../store/roleStore'

// First letters of the first two words, e.g. "Sasha Rinaldi" -> "SR".
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type Props = {
  /**
   * `button` (default) is the compact top-bar control; `card` is the
   * full-width account card shown at the foot of the sidebar.
   */
  variant?: 'button' | 'card'
}

export function UserMenu({ variant = 'button' }: Props) {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const effectiveRole = useEffectiveRole()
  const setOverride = useRoleStore((s) => s.setOverride)
  const canReset = useCan('data.reset')

  if (!user) return null

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    await navigate({ to: '/login' })
  }

  const handleReset = async () => {
    await resetMockData()
    toast.success('Data demo direset')
    window.location.reload()
  }

  const isCard = variant === 'card'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCard ? (
          <button
            type="button"
            aria-label="Menu pengguna"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none transition-colors',
              'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs">
              {initials(user.fullName)}
            </span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium text-sm">{user.fullName}</span>
              <span className="truncate text-muted-foreground text-xs">
                {ROLE_LABEL[effectiveRole]}
              </span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-2" aria-label="Menu pengguna">
            <UserIcon />
            <span className="hidden sm:inline">{user.fullName}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isCard ? 'start' : 'end'}
        side={isCard ? 'top' : 'bottom'}
        className="min-w-56"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.fullName}</span>
            <span className="font-normal text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        {/* Demo-only: the role switcher and mock-data reset must never ship to
            production, where they would let any user change their effective
            role (FEsec-H1). `import.meta.env.DEV` folds to `false` in a prod
            build so this whole block tree-shakes out. */}
        {import.meta.env.DEV ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
              Mode peran (demo)
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={effectiveRole}
              onValueChange={(value) => {
                if (isRole(value)) setOverride(value)
              }}
            >
              {ROLES.map((role) => (
                <DropdownMenuRadioItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {canReset ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleReset}>
                  <RotateCcwIcon />
                  Reset data demo
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} disabled={logoutMutation.isPending}>
          <LogOutIcon />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
