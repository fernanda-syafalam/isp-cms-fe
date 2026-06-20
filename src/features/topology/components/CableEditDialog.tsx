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
import {
  type Cable,
  type CableKind,
  CableKindSchema,
  type CableStatus,
  CableStatusSchema,
} from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useUpdateCable } from '../hooks/useCabling'

const KIND_LABEL: Record<CableKind, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}
const STATUS_LABEL: Record<CableStatus, string> = {
  planned: 'Rencana',
  installed: 'Terpasang',
  retired: 'Pensiun',
}

// Editable metadata only — the endpoints (from/to) are structural and the route
// is edited on the map (updateCableRoute), so they're shown read-only here.
const FormSchema = z.object({
  kind: CableKindSchema,
  spec: z.string().min(1, 'Spesifikasi wajib diisi').max(80),
  fiberCount: z.number().int().positive('Jumlah fiber > 0'),
  tubeCount: z.number().int().positive('Jumlah tube > 0'),
  status: CableStatusSchema,
})
type CableEditValues = z.infer<typeof FormSchema>

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
    resolver: zodResolver(FormSchema),
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
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                    <Input autoComplete="off" {...field} />
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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Status kabel">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL) as CableStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
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
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
