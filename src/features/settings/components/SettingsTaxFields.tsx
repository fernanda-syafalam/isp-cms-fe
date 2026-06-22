import type { Control } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import type { SettingsFormValues } from './settingsFormSchema'

type Props = {
  control: Control<SettingsFormValues>
  canManage: boolean
}

// "Pajak" section — PKP status and the effective PPN rate used when billing.
export function SettingsTaxFields({ control, canManage }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pajak (PPN / e-Faktur)</CardTitle>
        <CardDescription>
          Status PKP & tarif PPN efektif yang dipakai saat menghitung tagihan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={control}
            name="tax.pkp"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={!canManage}
                    aria-label="Pengusaha Kena Pajak"
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Penerbit adalah Pengusaha Kena Pajak (PKP) — tagihan dikenakan PPN
                </FormLabel>
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="tax.npwp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPWP penerbit</FormLabel>
                  <FormControl>
                    <Input disabled={!canManage} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="tax.ppnRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarif PPN efektif</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={!canManage}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>0.11 = 11% (DPP 11/12).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
