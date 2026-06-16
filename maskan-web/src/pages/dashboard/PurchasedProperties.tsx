import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api, { getImageUrl } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

function SkeletonCard() {
  return (
    <Card className="border-0 shadow-card overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}

export default function PurchasedProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPurchased()
  }, [])

  const fetchPurchased = async () => {
    try {
      const res = await api.get('/properties/sold/')
      setProperties(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Home className="w-6 h-6 text-teal-600" />
          Biens achetés
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {loading ? '...' : `${properties.length} bien${properties.length !== 1 ? 's' : ''} acheté${properties.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucun bien acheté</h3>
            <p className="text-sm text-slate-500 mb-4">Vous n'avez pas encore acheté de bien.</p>
            <Link to="/properties">
              <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">Parcourir les biens</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/properties/${p.id}`} className="block group cursor-pointer">
                <Card className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    <img
                      src={getImageUrl(p.main_image_url) || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-teal-700 text-white border-0 flex items-center gap-1">
                      <CheckIcon /> Acheté
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">{p.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {p.city}, {p.region}
                    </div>
                    <p className="text-sm font-bold text-teal-700 mt-1">{formatPrice(p.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
