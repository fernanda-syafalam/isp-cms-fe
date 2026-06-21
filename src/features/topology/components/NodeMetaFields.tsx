import type { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NodeType } from '@/schemas/topology'

import type { NodeFormValues } from './nodeFormSchema'

const RATIOS = ['1:4', '1:8', '1:16', '1:32'] as const

// Per-type infra fields for the generic node form: ODC/ODP capture the splitter
// ratio (drives capacity); OLT captures IP + model. Customers never reach this
// form — they go through the install flow.
export function NodeMetaFields({
  form,
  type,
}: {
  form: UseFormReturn<NodeFormValues>
  type: NodeType
}) {
  if (type === 'odc' || type === 'odp') {
    return (
      <FormField
        control={form.control}
        name="splitterRatio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rasio splitter</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full" aria-label="Rasio splitter">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RATIOS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (type === 'olt') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="ipAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="10.20.1.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="ZTE C320" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )
  }

  return null
}
