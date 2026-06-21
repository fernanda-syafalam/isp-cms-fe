import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { DetailMeta, DetailMetaGrid, DetailSectionLabel } from '@/components/shared/detail-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCan } from '@/features/auth'
import type { Customer } from '@/schemas/customer'

import { useUpdateCustomer } from '../hooks/useCustomers'

// Contact block with in-place edit — toggle to edit phone/email/address right
// in the drawer (gated customers.manage) instead of opening the full dialog.
// Remounted per customer (keyed) so the inputs always seed from fresh data.
export function CustomerContact({ customer }: { customer: Customer }) {
  const canManage = useCan('customers.manage')
  const update = useUpdateCustomer(customer.id)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email ?? '')
  const [address, setAddress] = useState(customer.address)

  const cancel = () => {
    setPhone(customer.phone)
    setEmail(customer.email ?? '')
    setAddress(customer.address)
    setEditing(false)
  }

  const save = async () => {
    try {
      await update.mutateAsync({
        fullName: customer.fullName,
        planId: customer.planId,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      })
      setEditing(false)
    } catch {
      // useUpdateCustomer surfaces the error via toast.
    }
  }

  const valid = phone.trim().length >= 6 && address.trim().length > 0

  return (
    <section className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <DetailSectionLabel>Kontak</DetailSectionLabel>
        {canManage && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Telepon
            </span>
            <Input
              aria-label="Telepon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Email
            </span>
            <Input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Alamat
            </span>
            <Input
              aria-label="Alamat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={update.isPending}>
              Batal
            </Button>
            <Button size="sm" onClick={save} disabled={!valid || update.isPending}>
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <DetailMetaGrid>
          <DetailMeta label="Telepon">{customer.phone}</DetailMeta>
          <DetailMeta label="Email">{customer.email ?? '—'}</DetailMeta>
          <DetailMeta label="Reseller">{customer.resellerName ?? '—'}</DetailMeta>
          <DetailMeta label="Alamat">{customer.address}</DetailMeta>
        </DetailMetaGrid>
      )}
    </section>
  )
}
