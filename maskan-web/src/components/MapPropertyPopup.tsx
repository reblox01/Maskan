import { Link } from 'react-router-dom'
import { BedDouble, Bath, Maximize, MapPin, ArrowUpRight } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import type { MapPin as MapPinType } from '@/types'

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

interface MapPropertyPopupProps {
  pin: MapPinType & {
    area_sqm?: number
    bedrooms?: number
    bathrooms?: number
    image_data?: string
  }
}

export default function MapPropertyPopup({ pin }: MapPropertyPopupProps) {
  const imageUrl = pin.image_data
    ? `data:image/jpeg;base64,${pin.image_data}`
    : placeholderImages[pin.property_type] || placeholderImages.apartment

  const typeLabel = typeLabels[pin.property_type] || pin.property_type
  const statusColor = statusColors[pin.status] || statusColors.available
  const statusLabel = statusLabels[pin.status] || statusLabels.available

  return (
    <div className="w-[260px] font-sans overflow-hidden rounded-xl">
      {/* Image */}
      <div className="relative h-[140px] overflow-hidden">
        <img
          src={imageUrl}
          alt={pin.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Status badge */}
        <div className={cn(
          "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white uppercase tracking-wide shadow-sm",
          statusColor
        )}>
          {statusLabel}
        </div>
        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white">
          {typeLabel}
        </div>
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">
          {pin.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{pin.city}</span>
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-teal-700">
          {formatPrice(pin.price)}
        </p>

        {/* Specs row */}
        {(pin.bedrooms || pin.bathrooms || pin.area_sqm) && (
          <div className="flex items-center gap-3 text-xs text-slate-600">
            {pin.bedrooms && pin.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                <span>{pin.bedrooms}</span>
              </div>
            )}
            {pin.bathrooms && pin.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <span>{pin.bathrooms}</span>
              </div>
            )}
            {pin.area_sqm && (
              <div className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-slate-400" />
                <span>{pin.area_sqm} m²</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          to={`/properties/${pin.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors cursor-pointer no-underline"
        >
          Voir le bien
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
