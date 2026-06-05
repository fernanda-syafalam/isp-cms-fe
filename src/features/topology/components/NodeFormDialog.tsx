import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type NetworkNode, NodeStatusSchema, NodeTypeSchema } from '@/schemas/topology'

import { TYPE_LABEL } from '../lib/graph'
import { useCreateNode, useUpdateNode } from '../hooks/useTopology'

const NO_PARENT = 'none'
const TYPES = NodeTypeSchema.options
const STATUSES = NodeStatusSchema.options

const FormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120),
  type: NodeTypeSchema,
  status: NodeStatusSchema,
  parentId: z.string(),
})
type FormValues = z.infer<typeof FormSchema>

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

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    values: {
      name: node?.name ?? '',
      type: node?.type ?? 'customer',
      status: node?.status ?? 'up',
      parentId: node?.parentId ?? NO_PARENT,
    },
  })

  const parentOptions = nodes.filter((n) => n.id !== node?.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const parentId = values.parentId === NO_PARENT ? null : values.parentId
    try {
      if (node) {
        await update.mutateAsync({
          id: node.id,
          input: {
            name: values.name,
            type: values.type,
            status: values.status,
            parentId,
          },
        })
      } else if (latLng) {
        await create.mutateAsync({
          name: values.name,
          type: values.type,
          status: values.status,
          parentId,
          lat: latLng.lat,
          lng: latLng.lng,
        })
      }
      onOpenChange(false)
    } catch {
      // mutation hooks surface a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit node' : 'Tambah node'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui nama, tipe, status, dan uplink.'
              : `Titik baru pada ${latLng?.lat.toFixed(5)}, ${latLng?.lng.toFixed(5)}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full" aria-label="Tipe">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full" aria-label="Status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uplink (induk)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Uplink">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>Tidak ada (root / OLT)</SelectItem>
                      {parentOptions.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {TYPE_LABEL[n.type]} · {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
