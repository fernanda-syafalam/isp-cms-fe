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
import { CableKindSchema, type CableKind, type CreateCableInput } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useCreateCable } from '../hooks/useCabling'
import { segmentMeters, TYPE_LABEL } from '../lib/graph'

const KIND_LABEL: Record<CableKind, string> = {
  feeder: 'Feeder (OLT→ODC)',
  distribution: 'Distribusi (ODC→ODP)',
  drop: 'Drop (ODP→pelanggan)',
}

// User-entered fields only; route/length/status are derived on submit.
const FormSchema = z
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

type CableFormValues = z.infer<typeof FormSchema>

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
    resolver: zodResolver(FormSchema),
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
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="fromNodeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dari node</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Dari node">
                        <SelectValue placeholder="Pilih node awal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((n) => (
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
            <FormField
              control={form.control}
              name="toNodeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ke node</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Ke node">
                        <SelectValue placeholder="Pilih node akhir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((n) => (
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
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Jenis kabel">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(KIND_LABEL) as CableKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND_LABEL[k]}
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
              name="spec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spesifikasi</FormLabel>
                  <FormControl>
                    <Input placeholder="mis. G.652D 12F loose-tube" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fiberCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah fiber</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tubeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah tube</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
