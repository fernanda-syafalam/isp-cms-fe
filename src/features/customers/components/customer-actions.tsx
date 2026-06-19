import { Link } from '@tanstack/react-router'
import {
  MapPinIcon,
  MessageCircleIcon,
  NavigationIcon,
  PlugZapIcon,
  PowerOffIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import type { Customer } from '@/schemas/customer'

import { useActivateCustomer, useIsolateCustomer, useNotifyWhatsapp } from '../hooks/useCustomers'

// Shared operator actions for a subscriber, used by both the Customer 360° page
// header and the quick-view drawer so the two stay in lockstep.

/**
 * Network-enforcement lifecycle toggle (gated `network.manage`): Isolir when
 * aktif, Aktifkan when isolir, nothing otherwise. The contextual primary.
 */
export function CustomerStatusAction({ customer }: { customer: Customer }) {
  const canNetwork = useCan('network.manage')
  const isolate = useIsolateCustomer()
  const activate = useActivateCustomer()
  const busy = isolate.isPending || activate.isPending

  if (!canNetwork) return null

  if (customer.status === 'aktif') {
    return (
      <Button
        variant="destructive"
        size="sm"
        disabled={busy}
        onClick={() => isolate.mutate(customer.id)}
      >
        <PowerOffIcon className="size-4" />
        Isolir
      </Button>
    )
  }
  if (customer.status === 'isolir') {
    return (
      <Button size="sm" disabled={busy} onClick={() => activate.mutate(customer.id)}>
        <PlugZapIcon className="size-4" />
        Aktifkan
      </Button>
    )
  }
  return null
}

/** Send a WhatsApp reminder to the subscriber (billing/dunning log). */
export function CustomerWhatsappButton({ customerId }: { customerId: string }) {
  const notify = useNotifyWhatsapp(customerId)
  return (
    <Button variant="outline" size="sm" disabled={notify.isPending} onClick={() => notify.mutate()}>
      <MessageCircleIcon className="size-4" />
      <span className="hidden sm:inline">Ingatkan (WA)</span>
    </Button>
  )
}

// Build a Google Maps directions query from the subscriber's address (Jepara
// locale fallback so the pin lands in the right regency).
function mapsQuery(customer: Customer): string {
  const query = [customer.address, customer.areaName, 'Jepara', 'Jawa Tengah']
    .filter(Boolean)
    .join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Open Google Maps directions to the subscriber's premises. */
export function CustomerNavigateButton({ customer }: { customer: Customer }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={mapsQuery(customer)} target="_blank" rel="noopener noreferrer">
        <NavigationIcon className="size-4" />
        <span className="hidden sm:inline">Navigasi</span>
      </a>
    </Button>
  )
}

/** Focus the subscriber's node on the network map (hidden while prospek). */
export function CustomerMapButton({ customer }: { customer: Customer }) {
  if (customer.status === 'prospek') return null
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/network/topology" search={{ focus: `${customer.id}-node` }}>
        <MapPinIcon className="size-4" />
        <span className="hidden sm:inline">Lihat di peta</span>
      </Link>
    </Button>
  )
}
