import type { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { usePlansList } from '@/features/plans'
import type { CreateLeadInput } from '@/schemas/lead'

type Props = {
  form: UseFormReturn<CreateLeadInput>
  plansQuery: ReturnType<typeof usePlansList>
}

// "Paket diminati" picker for a new lead: backed by usePlansList with its own
// loading / error+retry / empty affordances. Picking a plan seeds estValue with
// the plan's monthly price.
export function LeadPlanSelectField({ form, plansQuery }: Props) {
  const plans = plansQuery.data
  return (
    <FormField
      control={form.control}
      name="planName"
      render={({ field }) => {
        const noPlans =
          !plansQuery.isLoading && !plansQuery.isError && (plans?.items.length ?? 0) === 0
        return (
          <FormItem>
            <FormLabel>Paket diminati</FormLabel>
            <Select
              value={field.value}
              disabled={plansQuery.isLoading || plansQuery.isError}
              onValueChange={(name) => {
                field.onChange(name)
                const plan = plans?.items.find((p) => p.name === name)
                if (plan) form.setValue('estValue', plan.priceMonthly)
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      plansQuery.isLoading
                        ? 'Memuat paket…'
                        : plansQuery.isError
                          ? 'Gagal memuat paket'
                          : 'Pilih paket'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {plans?.items.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plansQuery.isError ? (
              <button
                type="button"
                onClick={() => plansQuery.refetch()}
                className="justify-self-start text-destructive text-xs underline-offset-2 hover:underline"
              >
                Gagal memuat paket. Coba lagi.
              </button>
            ) : noPlans ? (
              <p className="text-muted-foreground text-xs">Belum ada paket aktif.</p>
            ) : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
