import type { Role } from '@/lib/permissions'

// First seeded reseller storefront ("Loket Andi"); see src/test/msw/handlers.ts
// (RESELLER_FIXTURES[0]). Used only to give a dev-switched mitra a concrete
// storefront to open.
export const DEV_DEMO_RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'

// Resolve which reseller storefront the mitra home should open.
//
// A real mitra carries their own `resellerId` (P1.5) and always uses it. The DEV
// role switcher (UserMenu → roleStore) only regates client nav; it does NOT swap
// the mock identity, so a demo-er switching to "mitra" still has a null
// resellerId and would dead-end on "belum tertaut". In a dev build we fall back
// to the first seeded storefront so the mitra home renders directly.
//
// Production safety: `import.meta.env.DEV` folds to `false` in a prod bundle, so
// this collapses to `return resellerId ?? null` and the fallback + the demo id
// tree-shake out. The real unlinked-mitra guard in ResellersListPage is
// therefore preserved and the role override stays dead in prod (FEsec-H1, #356).
export function resolveMitraResellerId(
  role: Role,
  resellerId: string | null | undefined,
): string | null {
  if (resellerId) return resellerId
  if (import.meta.env.DEV && role === 'mitra') return DEV_DEMO_RESELLER_ID
  return null
}
