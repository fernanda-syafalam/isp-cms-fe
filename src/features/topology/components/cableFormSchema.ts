import { z } from 'zod'

import { CableKindSchema } from '@/schemas/cable'

// User-entered fields only; route/length/status are derived on submit.
export const CableFormSchema = z
  .object({
    fromNodeId: z.string().min(1, 'Pilih node awal'),
    toNodeId: z.string().min(1, 'Pilih node akhir'),
    kind: CableKindSchema,
    spec: z.string().min(1, 'Spesifikasi wajib diisi').max(80),
    fiberCount: z.number().int().positive('Jumlah fiber > 0'),
    tubeCount: z.number().int().positive('Jumlah tube > 0'),
  })
  .refine((v) => v.fromNodeId !== v.toNodeId, {
    message: 'Node awal & akhir harus berbeda',
    path: ['toNodeId'],
  })

export type CableFormValues = z.infer<typeof CableFormSchema>
