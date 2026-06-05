import { useNavigate } from '@tanstack/react-router'
import { LogOutIcon, UserIcon } from 'lucide-react'

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

import { useCurrentUser, useLogout } from '../hooks/useAuth'
import { useEffectiveRole } from '../hooks/useRole'
import { useRoleStore } from '../store/roleStore'

export function UserMenu() {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const effectiveRole = useEffectiveRole()
  const setOverride = useRoleStore((s) => s.setOverride)

  if (!user) return null

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    await navigate({ to: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Menu pengguna">
          <UserIcon />
          <span className="hidden sm:inline">{user.fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.fullName}</span>
            <span className="font-normal text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          Mode peran (demo)
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={effectiveRole}
          onValueChange={(value) => {
            if (value === 'admin' || value === 'staff') setOverride(value)
          }}
        >
          <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="staff">Staf</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} disabled={logoutMutation.isPending}>
          <LogOutIcon />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
