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
import { CreatePlanSchema, type CreatePlanInput, type Plan } from '@/schemas/plan'

import { useUpdatePlan } from '../hooks/usePlans'

type Props = {
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPlanDialog({ plan, open, onOpenChange }: Props) {
  const updateMutation = useUpdatePlan(plan.id)

  const form = useForm<CreatePlanInput>({
    resolver: zodResolver(CreatePlanSchema),
    values: {
      name: plan.name,
      speedMbps: plan.speedMbps,
      priceMonthly: plan.priceMonthly,
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // useUpdatePlan surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit paket</DialogTitle>
          <DialogDescription>Perbarui detail paket.</DialogDescription>
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
            <FormField
              control={form.control}
              name="speedMbps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kecepatan (Mbps)</FormLabel>
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
              name="priceMonthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga / bulan (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
