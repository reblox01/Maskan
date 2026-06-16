import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import { getFavorites, toggleFavorite, getImageUrl } from '@/lib/api'
import type { Favorite } from '@/types'

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
  const [saved, setSaved] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const data = await getFavorites()
      setSaved(data)
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (propertyId: string) => {
    try {
      await toggleFavorite(propertyId)
      setSaved(prev => prev.filter(f => f.property !== propertyId))
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
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
          {saved.map((fav, i) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow group">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-32 h-auto flex-shrink-0">
                      <img
                        src={getImageUrl(fav.property_image_url) || placeholderImages[fav.property_type] || placeholderImages.apartment}
                        alt={fav.property_title}
                        className="w-full h-full object-cover rounded-l-xl"
                      />
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{fav.property_title}</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {fav.property_city}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(fav.property)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-base font-bold text-teal-700 mt-2">{formatPrice(fav.property_price)}</p>
                      <Link to={`/properties/${fav.property}`}>
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
