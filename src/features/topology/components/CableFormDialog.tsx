import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CreateCableInput } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useCreateCable } from '../hooks/useCabling'
import { segmentMeters } from '../lib/graph'
import { CableForm } from './CableForm'
import { CableFormSchema, type CableFormValues } from './cableFormSchema'

type Props = {
  nodes: NetworkNode[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Record a physical cable run between two nodes. The route is the straight line
// between them (route: []) with the length derived from the node coordinates —
// the surveyed polyline is edited later on the map (updateCableRoute). Mirrors
// NodeFormDialog (RHF + zodResolver + mutation).
export function CableFormDialog({ nodes, open, onOpenChange }: Props) {
  const createMutation = useCreateCable()
  const options = [...nodes].sort((a, b) => a.name.localeCompare(b.name))

  const form = useForm<CableFormValues>({
    resolver: zodResolver(CableFormSchema),
    defaultValues: {
      fromNodeId: '',
      toNodeId: '',
      kind: 'distribution',
      spec: '',
      fiberCount: 12,
      tubeCount: 1,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const from = nodes.find((n) => n.id === values.fromNodeId)
    const to = nodes.find((n) => n.id === values.toNodeId)
    if (!from || !to) return
    const input: CreateCableInput = {
      ...values,
      route: [],
      lengthM: Math.round(segmentMeters(from, to)),
      status: 'planned',
      installedAt: null,
    }
    try {
      await createMutation.mutateAsync(input)
      form.reset()
      onOpenChange(false)
    } catch {
      // useCreateCable surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah kabel</DialogTitle>
          <DialogDescription>
            Catat kabel fisik antar node. Rute awal lurus dari→ke; sunting jalurnya nanti di peta.
          </DialogDescription>
        </DialogHeader>
        <CableForm
          form={form}
          options={options}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
