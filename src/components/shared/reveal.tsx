import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Props = {
  children: ReactNode
  /** Stagger delay in ms (use index * step from the caller). */
  delay?: number
  className?: string
}

// Subtle entrance animation (fade + rise). `motion-safe:` + the global
// reduced-motion rule make it a no-op for users who opt out.
export function Reveal({ children, delay = 0, className }: Props) {
  return (
    <div
      className={cn(
        'motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in motion-safe:duration-300 motion-safe:fill-mode-both',
        className,
      )}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
