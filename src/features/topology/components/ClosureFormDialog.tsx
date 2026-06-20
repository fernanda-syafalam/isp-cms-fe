import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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
import { type ClosureType, type CreateClosureInput, CreateClosureSchema } from '@/schemas/closure'

import { useCreateClosure } from '../hooks/useCabling'

const TYPE_LABEL: Record<ClosureType, string> = {
  odc: 'ODC',
  odp: 'ODP',
  joint: 'Sambungan',
  inline: 'Inline',
}

type Props = {
  nodeId: string
  /** Sensible default closure type for the host node (e.g. an ODP node → odp). */
  defaultType: ClosureType
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Add a splice closure to an ODC/ODP node that doesn't have one yet. The host
// node is fixed by the caller; mirrors NodeFormDialog (RHF + zodResolver + mutation).
export function ClosureFormDialog({ nodeId, defaultType, open, onOpenChange }: Props) {
  const createMutation = useCreateClosure()

  const form = useForm<CreateClosureInput>({
    resolver: zodResolver(CreateClosureSchema),
    values: {
      nodeId,
      type: defaultType,
      trayCapacity: 24,
      fiberCapacity: 24,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // useCreateClosure surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah closure</DialogTitle>
          <DialogDescription>
            Pasang closure (joint enclosure) pada node ini untuk mencatat sambungan fiber.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Tipe closure">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(TYPE_LABEL) as ClosureType[]).map((t) => (
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="trayCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas tray</FormLabel>
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
                name="fiberCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas fiber</FormLabel>
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
