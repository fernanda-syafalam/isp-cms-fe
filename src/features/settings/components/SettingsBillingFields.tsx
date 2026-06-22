import type { Control } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import type { SettingsFormValues } from './settingsFormSchema'

type Props = {
  control: Control<SettingsFormValues>
  canManage: boolean
}

// "Penagihan" section — billing cycle, late fee, and the auto-isolir threshold.
export function SettingsBillingFields({ control, canManage }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Penagihan</CardTitle>
        <CardDescription>
          Mengatur siklus tagihan, denda, dan ambang isolir otomatis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="billing.lateFeeIdr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denda (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      disabled={!canManage}
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
              control={control}
              name="billing.dueDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo (hari)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      disabled={!canManage}
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
              control={control}
              name="billing.isolirGraceDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Toleransi isolir (hari)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      disabled={!canManage}
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
        </div>
      </CardContent>
    </Card>
  )
}
