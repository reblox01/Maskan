import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BedDouble, Bath, Maximize, MapPin, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatPrice, formatMonthlyPayment } from '@/lib/utils'
import type { Property } from '@/types'

const statusConfig = {
  available: { label: 'Disponible', variant: 'success' as const },
  sold: { label: 'Vendu', variant: 'destructive' as const },
  rented: { label: 'Loué', variant: 'secondary' as const },
  pending: { label: 'En attente', variant: 'warning' as const },
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

// Placeholder images for demo (since we store base64 in DB, these are fallbacks)
const placeholderImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
]

interface PropertyCardProps {
  property: Property
  index?: number
}

function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const images = property.images?.length
    ? property.images.map((img) => `data:image/jpeg;base64,${img.image_data}`)
    : [placeholderImages[index % placeholderImages.length]]

  const status = statusConfig[property.status] || statusConfig.available
  const typeLabel = typeLabels[property.property_type] || property.property_type

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link to={`/properties/${property.id}`} className="block group cursor-pointer">
        <div
          className="rounded-xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <motion.img
              src={images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />

            {/* Status Badge */}
            <Badge
              variant={status.variant}
              className="absolute top-3 left-3 shadow-sm"
            >
              {status.label}
            </Badge>

            {/* Featured Badge */}
            {property.is_featured && (
              <Badge className="absolute top-3 right-12 bg-amber-500 text-white shadow-sm border-0">
                Vedette
              </Badge>
            )}

            {/* Favorite Button */}
            <button
              onClick={toggleFavorite}
              className={cn(
                "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
                isFavorited ? "bg-red-500 text-white" : "bg-white/80 text-slate-600 hover:bg-white"
              )}
              aria-label="Ajouter aux favoris"
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </button>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <motion.button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full cursor-pointer",
                        i === currentImage ? "bg-white" : "bg-white/50"
                      )}
                      animate={{ scale: i === currentImage ? 1.3 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImage(i) }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-1.5">
            {/* Price */}
            <p className="text-lg font-bold text-teal-900">
              {formatPrice(property.price)}
            </p>
            <p className="text-xs text-slate-500">
              À partir de {formatMonthlyPayment(property.price)}
            </p>

            {/* Location */}
            <div className="flex items-center gap-1 text-sm font-medium text-teal-800">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.city}</span>
              {property.region && property.region !== property.city && (
                <span className="text-slate-400">, {property.region}</span>
              )}
            </div>

            {/* Specs */}
            <div className="flex items-center gap-3 text-sm text-slate-600 pt-1">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1">
                  <BedDouble className="w-4 h-4 text-slate-400" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4 text-slate-400" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4 text-slate-400" />
                <span>{property.area_sqm} m²</span>
              </div>
            </div>

            {/* Type */}
            <p className="text-xs text-slate-400 pt-0.5">{typeLabel}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default memo(PropertyCard)
