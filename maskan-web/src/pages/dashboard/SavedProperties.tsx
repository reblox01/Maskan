import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2, MapPin, BedDouble, Bath, Maximize } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'

// Mock saved properties — in production fetch from API
const mockSaved = [
  { id: '1', title: 'Appartement F3 à Californie', city: 'Casablanca', price: 1800000, area_sqm: 120, bedrooms: 3, bathrooms: 2, property_type: 'apartment' },
  { id: '2', title: 'Villa à Palmeraie', city: 'Marrakech', price: 8500000, area_sqm: 450, bedrooms: 5, bathrooms: 4, property_type: 'villa' },
  { id: '3', title: 'Studio meublé à Gueliz', city: 'Marrakech', price: 450000, area_sqm: 35, bedrooms: 1, bathrooms: 1, property_type: 'studio' },
]

const placeholderImages: Record<string, string> = {
  apartment: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop',
  villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&h=200&fit=crop',
  studio: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop',
}

function SavedPropertySkeleton() {
  return (
    <Card className="border-0 shadow-card">
      <CardContent className="p-0">
        <div className="flex">
          <Skeleton className="w-32 h-auto min-h-[140px] rounded-l-xl" />
          <div className="p-4 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-28" />
            <div className="flex gap-3"><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-10" /></div>
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SavedProperties() {
  const [saved, setSaved] = useState<typeof mockSaved>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setSaved(mockSaved)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = (id: string) => {
    setSaved(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Biens sauvegardés</h1>
        <p className="text-sm text-slate-500 mt-1">
          {loading ? '...' : `${saved.length} bien${saved.length !== 1 ? 's' : ''} dans vos favoris`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SavedPropertySkeleton key={i} />)}
        </div>
      ) : saved.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucun bien sauvegardé</h3>
            <p className="text-sm text-slate-500 mb-4">Cliquez sur le cœur pour sauvegarder un bien</p>
            <Link to="/properties">
              <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">Parcourir les biens</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saved.map((property, i) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow group">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-32 h-auto flex-shrink-0">
                      <img
                        src={placeholderImages[property.property_type] || placeholderImages.apartment}
                        alt={property.title}
                        className="w-full h-full object-cover rounded-l-xl"
                      />
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{property.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {property.city}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(property.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-base font-bold text-teal-700 mt-2">{formatPrice(property.price)}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{property.area_sqm} m²</span>
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span>
                      </div>
                      <Link to={`/properties/${property.id}`}>
                        <Button variant="outline" size="sm" className="mt-3 w-full cursor-pointer">Voir le bien</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
