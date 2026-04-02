import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapPin } from '@/types'
import MapPropertyPopup from '@/components/MapPropertyPopup'

// Custom teal marker
const tealIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #0F766E, #14B8A6);
    border: 3px solid white;
    border-radius: 50% 50% 50% 4px;
    transform: rotate(-45deg);
    box-shadow: 0 3px 12px rgba(15, 118, 110, 0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg style="transform: rotate(45deg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

// Active/selected marker (slightly larger)
const activeIcon = L.divIcon({
  className: 'custom-marker-active',
  html: `<div style="
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #0F766E, #14B8A6);
    border: 3px solid #F59E0B;
    border-radius: 50% 50% 50% 4px;
    transform: rotate(-45deg);
    box-shadow: 0 4px 20px rgba(15, 118, 110, 0.5);
    display: flex; align-items: center; justify-content: center;
    animation: markerPulse 2s infinite;
  ">
    <svg style="transform: rotate(45deg)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
})

function MapBoundsHandler({ pins }: { pins: MapPin[] }) {
  const map = useMap()

  useEffect(() => {
    if (pins.length === 0) return
    const validPins = pins.filter((p) => p.latitude && p.longitude)
    if (validPins.length === 0) return

    const bounds = L.latLngBounds(
      validPins.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number])
    )
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
  }, [pins, map])

  return null
}

function MapPinMarker({
  pin,
  isActive,
  onClick,
}: {
  pin: MapPin & { area_sqm?: number; bedrooms?: number; bathrooms?: number; image_data?: string }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Marker
      position={[Number(pin.latitude), Number(pin.longitude)]}
      icon={isActive ? activeIcon : tealIcon}
      eventHandlers={{ click: onClick }}
    >
      <Popup
        className="maskan-popup"
        maxWidth={280}
        minWidth={260}
        closeButton={false}
        offset={[0, -10]}
      >
        <MapPropertyPopup pin={pin} />
      </Popup>
    </Marker>
  )
}

interface PropertyMapProps {
  pins: MapPin[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
}

export default function PropertyMap({
  pins,
  center = [33.5731, -7.5898],
  zoom = 12,
  height = '500px',
  className = '',
}: PropertyMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activePinId, setActivePinId] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div
        className={`bg-slate-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement de la carte...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .maskan-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
        .maskan-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .maskan-popup .leaflet-popup-tip {
          box-shadow: none;
          background: white;
        }
        .maskan-popup a {
          text-decoration: none;
          color: inherit;
        }
        .maskan-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .maskan-popup .leaflet-popup-tip {
          box-shadow: none;
          background: white;
        }
        .custom-marker-active {
          animation: markerPulse 2s infinite;
        }
        @keyframes markerPulse {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(15, 118, 110, 0)); }
          50% { filter: drop-shadow(0 0 8px rgba(15, 118, 110, 0.5)); }
        }
      `}</style>
      <div className={`rounded-xl overflow-hidden border border-slate-200 ${className}`} style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {pins.length > 0 && <MapBoundsHandler pins={pins} />}

          {pins.map((pin) => {
            if (!pin.latitude || !pin.longitude) return null
            return (
              <MapPinMarker
                key={pin.id}
                pin={pin as MapPin & { area_sqm?: number; bedrooms?: number; bathrooms?: number; image_data?: string }}
                isActive={activePinId === pin.id}
                onClick={() => setActivePinId(pin.id)}
              />
            )
          })}
        </MapContainer>
      </div>
    </>
  )
}
