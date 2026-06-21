import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SplitterRatioSchema } from '@/schemas/splitter'
import { type NetworkNode, NodeTypeSchema } from '@/schemas/topology'

import { useCreateNode, useUpdateNode } from '../hooks/useTopology'
import { NodeForm } from './NodeForm'
import { NodeFormSchema, NO_PARENT, type NodeFormValues } from './nodeFormSchema'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: NetworkNode[]
  // edit mode
  node?: NetworkNode
  // add mode
  latLng?: { lat: number; lng: number }
}

export function NodeFormDialog({ open, onOpenChange, nodes, node, latLng }: Props) {
  const isEdit = Boolean(node)
  const create = useCreateNode()
  const update = useUpdateNode()

  const form = useForm<NodeFormValues>({
    resolver: zodResolver(NodeFormSchema),
    values: {
      name: node?.name ?? '',
      type: node?.type ?? 'odp',
      status: node?.status ?? 'up',
      parentId: node?.parentId ?? NO_PARENT,
      lat: node?.lat ?? latLng?.lat ?? 0,
      lng: node?.lng ?? latLng?.lng ?? 0,
      splitterRatio: SplitterRatioSchema.catch('1:8').parse(node?.meta?.splitter),
      ipAddress: node?.meta?.ipAddress ?? '',
      model: node?.meta?.model ?? '',
    },
  })

  // Customers are provisioned via "Pasang pelanggan" (which allocates cabling),
  // never created bare here — so hide that type except when editing one.
  const types = NodeTypeSchema.options.filter((t) => t !== 'customer' || node?.type === 'customer')
  const parentOptions = nodes.filter((n) => n.id !== node?.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const parentId = values.parentId === NO_PARENT ? null : values.parentId
    // Only send the directives relevant to the chosen type.
    const infra =
      values.type === 'olt'
        ? {
            ipAddress: values.ipAddress || undefined,
            model: values.model || undefined,
          }
        : values.type === 'odc' || values.type === 'odp'
          ? { splitterRatio: values.splitterRatio }
          : {}
    const base = {
      name: values.name,
      type: values.type,
      status: values.status,
      parentId,
      lat: values.lat,
      lng: values.lng,
      ...infra,
    }
    try {
      if (node) {
        await update.mutateAsync({ id: node.id, input: base })
      } else {
        await create.mutateAsync(base)
      }
      onOpenChange(false)
    } catch {
      // mutation hooks surface a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Cap at the viewport and scroll inside, so the form never overflows the
          screen on a laptop / short window. */}
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit node' : 'Tambah node'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Perbarui detail node, uplink, dan koordinat.' : 'Titik infrastruktur baru.'}
          </DialogDescription>
        </DialogHeader>
        <NodeForm
          form={form}
          types={types}
          parentOptions={parentOptions}
          isEdit={isEdit}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
