import { zodResolver } from '@hookform/resolvers/zod'
import { PackagePlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { statusLabel } from '@/lib/status-label'
import { InventoryKindSchema, StockInSchema, type StockInInput } from '@/schemas/inventory'

import { useStockIn } from '../hooks/useInventory'

export function StockInDialog() {
  const [open, setOpen] = useState(false)
  const stockIn = useStockIn()

  const form = useForm<StockInInput>({
    resolver: zodResolver(StockInSchema),
    defaultValues: { kind: 'onu', serial: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await stockIn.mutateAsync(values)
      form.reset({ kind: values.kind, serial: '' })
      setOpen(false)
    } catch {
      // useStockIn surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PackagePlusIcon className="size-4" />
          <span className="hidden sm:inline">Stok masuk</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stok masuk</DialogTitle>
          <DialogDescription>Daftarkan perangkat baru ke gudang.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {InventoryKindSchema.options.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {kind.toUpperCase()}
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
              name="serial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="cth. ZTEG12345678"
                      autoComplete="off"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-muted-foreground text-xs">
              Status awal: {statusLabel('warehouse')}.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Tambah stok'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
