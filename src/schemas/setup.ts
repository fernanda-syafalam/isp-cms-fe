import { z } from 'zod'

const count = z.number().int().nonnegative()

// Mirror of the backend `GET /v1/setup/status` payload (admin-only). Each group
// carries an honest server-computed `done` flag plus the raw counts that back
// it, so the FE renders real progress instead of faking it from proxy signals.
export const SetupStatusSchema = z.object({
  catalogue: z.object({ done: z.boolean(), plansCount: count }),
  network: z.object({
    done: z.boolean(),
    routersCount: count,
    profilesCount: count,
    poolsCount: count,
  }),
  branches: z.object({ done: z.boolean(), branchesCount: count }),
  settings: z.object({ done: z.boolean(), companyName: z.string() }),
  staff: z.object({ done: z.boolean(), staffCount: count }),
  onboarding: z.object({
    done: z.boolean(),
    instalasiCount: count,
    aktifCount: count,
  }),
  workOrders: z.object({ done: z.boolean(), installDoneCount: count }),
  active: z.object({ done: z.boolean(), activeCount: count }),
})

export type SetupStatus = z.infer<typeof SetupStatusSchema>
