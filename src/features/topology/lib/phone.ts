// Phone helpers behind the on-site tap-to-call / WhatsApp buttons. `tel:` takes
// the digits as-is (a leading "+" is kept); WhatsApp needs an international
// number, so a leading Indonesian "0" becomes "62". A wrong number means the
// technician can't reach the customer, so these are unit-tested.
export function telNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

export function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? `62${d.slice(1)}` : d
}
