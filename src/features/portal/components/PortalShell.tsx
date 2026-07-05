import { Link } from '@tanstack/react-router'
import { NetworkIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Reveal } from '@/components/shared/reveal'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UserMenu } from '@/features/auth'

type Props = {
  children: ReactNode
}

/**
 * Slim, mobile-first shell for the customer portal. Unlike the ops shell in
 * `__root.tsx` it has no sidebar, no ⌘K command menu, and no notification bell
 * — a subscriber only ever sees their own account, so the chrome stays minimal
 * and the content column narrow. Keeps the same `#main-content` skip target so
 * the route-focus a11y behaviour in RootLayout still works for this branch.
 */
export function PortalShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:font-medium focus:text-primary-foreground focus:text-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-border border-b bg-background/80 px-4 backdrop-blur">
        <Link to="/portal" className="flex items-center gap-2.5" aria-label="Beranda">
          <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NetworkIcon className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">ISP CMS</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <UserMenu variant="button" />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Reveal className="mx-auto w-full max-w-2xl p-4">{children}</Reveal>
      </main>
    </div>
  )
}
