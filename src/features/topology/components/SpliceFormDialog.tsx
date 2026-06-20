import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { FormSkeleton } from '@/components/shared/skeletons'
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
import { type CreateSpliceInput, CreateSpliceSchema, type SpliceType } from '@/schemas/closure'

import { useCreateSplice } from '../hooks/useCabling'
import { useCables } from '../hooks/useCabling'

const SPLICE_TYPE_LABEL: Record<SpliceType, string> = {
  fusion: 'Fusion',
  mechanical: 'Mekanis',
  passthrough: 'Pass-through',
}

const CABLE_KIND_LABEL: Record<string, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}

type Props = {
  closureId: string
  /** The closure's host node — used to offer the cables that touch it first. */
  nodeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Record a fusion/mechanical splice inside a closure: which IN strand (cable +
// tube + core) joins which OUT strand. Mirrors NodeFormDialog (RHF + zodResolver
// + mutation). The closure is fixed by the caller.
export function SpliceFormDialog({ closureId, nodeId, open, onOpenChange }: Props) {
  const createMutation = useCreateSplice()
  const cablesQuery = useCables()
  const allCables = cablesQuery.data?.items ?? []
  // Prefer cables that physically touch this closure's node; fall back to all so
  // the picker is never empty in sparse mock data.
  const local = allCables.filter((c) => c.fromNodeId === nodeId || c.toNodeId === nodeId)
  const cables = local.length > 0 ? local : allCables

  const form = useForm<CreateSpliceInput>({
    resolver: zodResolver(CreateSpliceSchema),
    defaultValues: {
      closureId,
      inCableId: '',
      inTubeNo: 1,
      inCoreNo: 1,
      outCableId: '',
      outTubeNo: 1,
      outCoreNo: 1,
      type: 'fusion',
      lossDb: 0.1,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      form.reset()
      onOpenChange(false)
    } catch {
      // useCreateSplice surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah sambungan</DialogTitle>
          <DialogDescription>
            Catat sambungan fiber (splice) di dalam closure: strand masuk → strand keluar.
          </DialogDescription>
        </DialogHeader>
        {cablesQuery.isError ? (
          <ErrorState
            title="Gagal memuat kabel"
            description="Daftar kabel tidak bisa diambil. Coba lagi."
            onRetry={() => cablesQuery.refetch()}
          />
        ) : cablesQuery.isLoading ? (
          <FormSkeleton fields={5} />
        ) : allCables.length === 0 ? (
          <EmptyState
            title="Belum ada kabel"
            description="Tambahkan kabel yang melewati closure ini sebelum mencatat sambungan."
          />
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="inCableId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Kabel masuk</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Kabel masuk">
                            <SelectValue placeholder="Pilih kabel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cables.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {CABLE_KIND_LABEL[c.kind] ?? c.kind} · {c.spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <NumberField control={form.control} name="inTubeNo" label="Tube masuk" min={1} />
                <NumberField
                  control={form.control}
                  name="inCoreNo"
                  label="Core masuk"
                  min={1}
                  max={12}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="outCableId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Kabel keluar</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Kabel keluar">
                            <SelectValue placeholder="Pilih kabel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cables.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {CABLE_KIND_LABEL[c.kind] ?? c.kind} · {c.spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <NumberField control={form.control} name="outTubeNo" label="Tube keluar" min={1} />
                <NumberField
                  control={form.control}
                  name="outCoreNo"
                  label="Core keluar"
                  min={1}
                  max={12}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Jenis sambungan">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(SPLICE_TYPE_LABEL) as SpliceType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {SPLICE_TYPE_LABEL[t]}
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
                  name="lossDb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loss (dB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
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
        )}
      </DialogContent>
    </Dialog>
  )
}

// Small reusable number field for the tube/core integer inputs.
function NumberField({
  control,
  name,
  label,
  min,
  max,
}: {
  control: ReturnType<typeof useForm<CreateSpliceInput>>['control']
  name: 'inTubeNo' | 'inCoreNo' | 'outTubeNo' | 'outCoreNo'
  label: string
  min: number
  max?: number
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              {...(max ? { max } : {})}
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
  )
}
