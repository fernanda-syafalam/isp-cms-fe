import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { FormSkeleton } from '@/components/shared/skeletons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type CreateSpliceInput, CreateSpliceSchema } from '@/schemas/closure'

import { useCables, useCreateSplice } from '../hooks/useCabling'
import { SpliceForm } from './SpliceForm'

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
          <SpliceForm
            form={form}
            cables={cables}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
