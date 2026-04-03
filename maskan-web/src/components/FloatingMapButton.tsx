import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, X, BedDouble, Bath, Maximize, ArrowUpRight } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, cn } from '@/lib/utils'
import api from '@/lib/api'
import type { MapPin } from '@/types'

const pinIcon = L.divIcon({
  className: 'floating-map-pin',
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

function MapBoundsHandler({ pins }: { pins: MapPin[] }) {
  const map = useMap()
  useEffect(() => {
    if (pins.length === 0) return
    const valid = pins.filter(p => p.latitude && p.longitude)
    if (valid.length === 0) return
    const bounds = L.latLngBounds(valid.map(p => [p.latitude, p.longitude] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [pins, map])
  return null
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500',
  sold: 'bg-red-500',
  rented: 'bg-amber-500',
  pending: 'bg-slate-400',
}

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  sold: 'Vendu',
  rented: 'Loué',
  pending: 'En attente',
}

const typeLabels: Record<string, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  house: 'Maison',
  land: 'Terrain',
  commercial: 'Local commercial',
  office: 'Bureau',
}

const placeholderImages: Record<string, string> = {
  apartment: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=180&fit=crop',
  villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&h=180&fit=crop',
  studio: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=180&fit=crop',
  house: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=180&fit=crop',
  land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=180&fit=crop',
  commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=180&fit=crop',
  office: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=180&fit=crop',
}

export default function FloatingMapButton() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [pins, setPins] = useState<MapPin[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPins = async () => {
    if (pins.length > 0) return
    setLoading(true)
    try {
      const res = await api.get('/properties/map-pins/')
      setPins(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    fetchPins()
  }

  const handleClose = () => setIsOpen(false)

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, type: 'spring' }}
      >
        <Button
          onClick={handleOpen}
          className="rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg hover:shadow-xl px-5 py-3 cursor-pointer gap-2"
        >
          <Map className="w-4 h-4" />
          <span className="text-sm font-medium">Voir le Map</span>
        </Button>
      </motion.div>

      {/* Map Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Map Panel */}
            <motion.div
              className="relative w-full h-[85vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Handle bar */}
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-3 pb-2 bg-gradient-to-b from-white/90 to-transparent">
                <div className="w-12 h-1.5 rounded-full bg-slate-300" />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Map */}
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full">
                  <style>{`
                    .floating-map-popup .leaflet-popup-content-wrapper {
                      border-radius: 12px;
                      padding: 0;
                      overflow: hidden;
                      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    }
                    .floating-map-popup .leaflet-popup-content {
                      margin: 0;
                      width: auto !important;
                    }
                    .floating-map-popup .leaflet-popup-tip {
                      box-shadow: none;
                      background: white;
                    }
                    .floating-map-popup a {
                      text-decoration: none;
                      color: inherit;
                    }
                  `}</style>
                  <MapContainer
                  center={[33.5731, -7.5898]}
                  zoom={7}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapBoundsHandler pins={pins} />
                  {pins.map((pin) => {
                    if (!pin.latitude || !pin.longitude) return null
                    return (
                      <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={pinIcon}>
                        <Popup className="floating-map-popup" maxWidth={280} minWidth={260} closeButton={true} offset={[0, -10]}>
                          <PopupCard pin={pin} navigate={navigate} />
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
                </div>
              )}

              {/* Pin count */}
              {!loading && pins.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-xs font-medium text-slate-700">
                  {pins.length} bien{pins.length > 1 ? 's' : ''}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function PopupCard({ pin, navigate }: { pin: MapPin; navigate: (path: string) => void }) {
  const imageUrl = placeholderImages[pin.property_type] || placeholderImages.apartment
  const typeLabel = typeLabels[pin.property_type] || pin.property_type
  const statusColor = statusColors[pin.status] || statusColors.available
  const statusLabel = statusLabels[pin.status] || statusLabels.available

  return (
    <div className="w-[260px] font-sans overflow-hidden rounded-xl" onClick={(e) => e.stopPropagation()}>
      <div className="relative h-[140px] overflow-hidden">
        <img src={imageUrl} alt={pin.title} className="w-full h-full object-cover" loading="lazy" />
        <div className={cn(
          "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white uppercase tracking-wide shadow-sm",
          statusColor
        )}>
          {statusLabel}
        </div>
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white">
          {typeLabel}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">{pin.title}</h3>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Map className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{pin.city}</span>
        </div>
        <p className="text-lg font-bold text-teal-700">{formatPrice(pin.price)}</p>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
            <span>{pin.bedrooms || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5 text-slate-400" />
            <span>{pin.bathrooms || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-3.5 h-3.5 text-slate-400" />
            <span>{pin.area_sqm} m²</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/properties/${pin.id}`)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors cursor-pointer no-underline"
        >
          Voir le bien
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
