import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, Plus, Edit, Trash2, Eye, MapPin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import type { Property } from '@/types'

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-emerald-100 text-emerald-700' },
  sold: { label: 'Vendu', color: 'bg-red-100 text-red-700' },
  rented: { label: 'Loué', color: 'bg-amber-100 text-amber-700' },
  pending: { label: 'En attente', color: 'bg-slate-100 text-slate-600' },
}

const placeholderImages: Record<string, string> = {
  apartment: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=140&fit=crop',
  villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=140&fit=crop',
  studio: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=140&fit=crop',
  house: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=140&fit=crop',
  land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=140&fit=crop',
  commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=140&fit=crop',
  office: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=140&fit=crop',
}

export default function DashboardProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    api.get('/properties/my-properties/')
      .then(res => setProperties(res.data.results || res.data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce bien ?')) return
    setDeleting(id)
    try {
      await api.delete(`/properties/${id}/`)
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes biens</h1>
          <p className="text-sm text-slate-500 mt-1">{properties.length} biens publiés</p>
        </div>
        <Link to="/dashboard/add-property">
          <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
              <Skeleton className="w-24 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucun bien</h3>
            <p className="text-sm text-slate-500 mb-4">Commencez par ajouter votre premier bien immobilier</p>
            <Link to="/dashboard/add-property">
              <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bien
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property, i) => {
            const status = statusConfig[property.status] || statusConfig.available
            const img = property.images?.[0]
              ? `data:image/jpeg;base64,${property.images[0].image_data}`
              : placeholderImages[property.property_type] || placeholderImages.apartment

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={img} alt={property.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{property.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold", status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.city}
                          </span>
                          <span>{property.area_sqm} m²</span>
                          <span>{property.bedrooms} ch.</span>
                        </div>
                        <p className="text-sm font-bold text-teal-700 mt-1">{formatPrice(property.price)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link to={`/properties/${property.id}`}>
                          <Button variant="ghost" size="sm" className="cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleDelete(property.id)}
                          disabled={deleting === property.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
