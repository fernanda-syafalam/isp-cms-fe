import { CompassIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useEffectiveRole } from '@/features/auth'
import { ROLE_HOME } from './nav'

type RouteNotFoundViewProps = {
  /** Where "back home" sends the user (role-aware landing page). */
  homeHref: string
}

/**
 * Presentational 404 body (no router/store coupling, so it is unit testable).
 * Recovery uses a plain anchor: hitting a dead URL is the right moment to reset
 * the app to a known-good state with a full navigation.
 */
export function RouteNotFoundView({ homeHref }: RouteNotFoundViewProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={CompassIcon}
        title="Halaman tidak ditemukan"
        description="Halaman yang Anda cari tidak ada atau telah dipindahkan."
        action={
          <Button asChild>
            <a href={homeHref}>Kembali ke beranda</a>
          </Button>
        }
      />
    </div>
  )
}

/**
 * Router not-found boundary. Used as the router's `defaultNotFoundComponent`, so
 * unmatched URLs render inside the app shell with a role-aware way home.
 */
export function RouteNotFound() {
  const home = ROLE_HOME[useEffectiveRole()] ?? '/'
  return <RouteNotFoundView homeHref={home} />
}
