import { MoreHorizontalIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/cn'

type Props = {
  /** The menu items — `DropdownMenuItem`, `DropdownMenuSeparator`, etc. */
  children: ReactNode
  /** Accessible name for the icon-only trigger. */
  label?: string
  /** Dropdown alignment relative to the trigger. */
  align?: 'start' | 'center' | 'end'
  /** Width/extra classes for the menu content (e.g. `w-48`). */
  contentClassName?: string
  /** Disables the trigger when no actions are available. */
  disabled?: boolean
}

/**
 * Standard row-level overflow menu: a ghost icon-button trigger (`⋯`) that opens
 * a dropdown. Owns only the trigger + content shell so each consumer keeps full
 * control of its items — dialogs, separators, conditional gating, and the
 * `variant="destructive"` styling — by passing them as children. Centralizes the
 * trigger styling and accessible name that were duplicated across feature tables.
 */
export function RowActions({
  children,
  label = 'Aksi baris',
  align = 'end',
  contentClassName,
  disabled = false,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={label}
          disabled={disabled}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn('w-44', contentClassName)}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
