import { z } from 'zod'

import { SplitterRatioSchema } from '@/schemas/splitter'
import { NodeStatusSchema, NodeTypeSchema } from '@/schemas/topology'

export const NO_PARENT = 'none'

export const NodeFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120),
  type: NodeTypeSchema,
  status: NodeStatusSchema,
  parentId: z.string(),
  lat: z.number().finite('Lat tidak valid'),
  lng: z.number().finite('Lng tidak valid'),
  splitterRatio: SplitterRatioSchema,
  ipAddress: z.string(),
  model: z.string(),
})

export type NodeFormValues = z.infer<typeof NodeFormSchema>
