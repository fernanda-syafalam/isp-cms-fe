import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { LocateFixedIcon } from 'lucide-react'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import { Button } from '@/components/ui/button'

// Default view: Kota Jepara, Jawa Tengah.
const JEPARA: [number, number] = [-6.5514, 110.6811]

// Teardrop pin (divIcon avoids Leaflet's broken default-marker asset paths).
const PIN = L.divIcon({
  className: 'location-pin',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px 9999px 9999px 0;transform:rotate(45deg);background:#2563eb;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>',
})

type LatLng = { lat: number; lng: number }

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ pos }: { pos: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(pos)
  }, [pos, map])
  return null
}

type Props = {
  value: LatLng | null
  onChange: (lat: number, lng: number) => void
}

// Shopee-style location picker: click or drag the pin to set coordinates.
export function LocationPicker({ value, onChange }: Props) {
  const pos: [number, number] = value ? [value.lat, value.lng] : JEPARA

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => onChange(p.coords.latitude, p.coords.longitude),
      () => {},
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-56 overflow-hidden rounded-lg border border-border">
        <MapContainer center={pos} zoom={14} scrollWheelZoom className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
            maxZoom={19}
          />
          <ClickToPick onPick={onChange} />
          {value ? <Recenter pos={pos} /> : null}
          {value ? (
            <Marker
              position={pos}
              icon={PIN}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng()
                  onChange(ll.lat, ll.lng)
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-muted-foreground text-xs">
          {value
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Klik peta untuk menandai titik instalasi'}
        </span>
        <Button type="button" variant="outline" size="sm" className="h-7" onClick={useMyLocation}>
          <LocateFixedIcon className="size-3.5" />
          Lokasi saya
        </Button>
      </div>
    </div>
  )
}
