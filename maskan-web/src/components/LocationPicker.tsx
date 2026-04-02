import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const markerIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `<div style="
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #0F766E, #14B8A6);
    border: 3px solid white;
    border-radius: 50% 50% 50% 4px;
    transform: rotate(-45deg);
    box-shadow: 0 4px 16px rgba(15, 118, 110, 0.5);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg style="transform: rotate(45deg)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.5 })
  }, [center, map])
  return null
}

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number, lng: number) => void
  onLocationDetails?: (city: string, region: string, address: string) => void
  className?: string
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; region: string; address: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    )
    const data = await res.json()
    const addr = data.address || {}
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
    const region = addr.state || addr.region || addr.county || ''
    const road = addr.road || addr.pedestrian || addr.neighbourhood || addr.suburb || ''
    const houseNumber = addr.house_number || ''
    const fullAddress = [houseNumber, road, city].filter(Boolean).join(', ')
    return { city, region, address: fullAddress || data.display_name?.split(',').slice(0, 3).join(', ') || '' }
  } catch {
    return null
  }
}

export default function LocationPicker({ latitude, longitude, onLocationChange, onLocationDetails, className }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>([33.5731, -7.5898])
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    if (latitude && longitude) {
      setCenter([Number(latitude), Number(longitude)])
    }
  }, [latitude, longitude])

  const handlePick = async (lat: number, lng: number) => {
    setCenter([lat, lng])
    onLocationChange(lat, lng)
    if (onLocationDetails) {
      const result = await reverseGeocode(lat, lng)
      if (result) {
        onLocationDetails(result.city, result.region, result.address)
      }
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCenter([lat, lng])
        onLocationChange(lat, lng)
        if (onLocationDetails) {
          const result = await reverseGeocode(lat, lng)
          if (result) {
            onLocationDetails(result.city, result.region, result.address)
          }
        }
        setGettingLocation(false)
      },
      () => {
        alert('Impossible de récupérer votre position')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
          className="cursor-pointer"
        >
          {gettingLocation ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-1.5" />
          )}
          {gettingLocation ? 'Localisation...' : 'Ma position'}
        </Button>
        {latitude && longitude && (
          <span className="text-xs text-slate-500">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 h-[300px]">
        <MapContainer
          center={center}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handlePick} />
          <MapUpdater center={center} />
          {latitude && longitude && (
            <Marker position={[Number(latitude), Number(longitude)]} icon={markerIcon} />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Cliquez sur la carte ou utilisez "Ma position"
      </p>
    </div>
  )
}
