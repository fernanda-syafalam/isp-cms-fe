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
import { SplitterRatioSchema } from '@/schemas/splitter'
import { type NetworkNode, NodeStatusSchema, NodeTypeSchema } from '@/schemas/topology'

import { useCreateNode, useUpdateNode } from '../hooks/useTopology'
import { TYPE_LABEL } from '../lib/graph'
import { NodeMetaFields } from './NodeMetaFields'

const NO_PARENT = 'none'
const STATUSES = NodeStatusSchema.options

const FormSchema = z.object({
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
export type NodeFormValues = z.infer<typeof FormSchema>

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
    resolver: zodResolver(FormSchema),
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
  const watchedType = form.watch('type')
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
                        {types.map((t) => (
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

            <NodeMetaFields form={form} type={watchedType} />

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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lat</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
