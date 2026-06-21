import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Cable } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useUpdateCable } from '../hooks/useCabling'
import { CableEditForm, CableEditFormSchema, type CableEditValues } from './CableEditForm'

type Props = {
  cable: Cable
  byId: Map<string, NetworkNode>
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Edit a cable's metadata (kind/spec/fiber/tube/status) via PATCH /cables/:id.
// Mirrors NodeFormDialog (RHF + zodResolver + mutation).
export function CableEditDialog({ cable, byId, open, onOpenChange }: Props) {
  const updateMutation = useUpdateCable()

  const form = useForm<CableEditValues>({
    resolver: zodResolver(CableEditFormSchema),
    values: {
      kind: cable.kind,
      spec: cable.spec,
      fiberCount: cable.fiberCount,
      tubeCount: cable.tubeCount,
      status: cable.status,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: cable.id, input: values })
      onOpenChange(false)
    } catch {
      // useUpdateCable surfaces a toast.
    }
  })

  const fromName = byId.get(cable.fromNodeId)?.name ?? cable.fromNodeId
  const toName = byId.get(cable.toNodeId)?.name ?? cable.toNodeId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit kabel</DialogTitle>
          <DialogDescription>
            {fromName} → {toName}. Sunting jalur (rute) di peta.
          </DialogDescription>
        </DialogHeader>
        <CableEditForm form={form} onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
