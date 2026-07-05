import { MapPinIcon } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CompleteWorkOrderInput } from '@/schemas/workorder'

import { WorkOrderPhotosField } from './WorkOrderPhotosField'

// Empty text/number inputs must resolve to `undefined` (not '' or NaN) so the
// all-optional Zod schema treats them as "not provided" rather than invalid.
const toNumber = (raw: string): number | undefined => {
  if (raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}
const toText = (raw: string): string | undefined => (raw.trim() === '' ? undefined : raw)

// The field stack for the completion form. Split out of the dialog to keep both
// components under the 200-line budget.
export function WorkOrderCompleteFields({ form }: { form: UseFormReturn<CompleteWorkOrderInput> }) {
  const [isLocating, setIsLocating] = useState(false)
  const gps = form.watch('gps')

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Perangkat ini tidak mendukung geolokasi.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setIsLocating(false)
        form.setValue('gps', {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        })
      },
      (err) => {
        setIsLocating(false)
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.'
            : 'Lokasi tidak tersedia saat ini.',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="onuSerial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial ONU (hasil scan)</FormLabel>
              <FormControl>
                <Input
                  className="font-mono"
                  placeholder="mis. ZTEG12345678"
                  autoComplete="off"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toText(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rxPower"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Redaman RX (dBm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="mis. -22.5"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toNumber(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto bukti (URL)</FormLabel>
              <WorkOrderPhotosField value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="signatureUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanda tangan pelanggan (URL)</FormLabel>
              <FormControl>
                <Input
                  inputMode="url"
                  placeholder="https://…/ttd.png"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toText(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-2">
          <FormLabel htmlFor="wo-complete-gps">Lokasi (GPS)</FormLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleLocate}
              disabled={isLocating}
              id="wo-complete-gps"
            >
              <MapPinIcon className="size-4" />
              {isLocating ? 'Mengambil…' : 'Ambil lokasi'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Belum diambil'}
            </span>
          </div>
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Catatan pekerjaan (opsional)"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toText(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}
