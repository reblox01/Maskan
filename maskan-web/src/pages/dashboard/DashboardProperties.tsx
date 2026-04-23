import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, Plus, Edit, Trash2, Eye, MapPin, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import type { Property, VerificationStatus } from '@/types'

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-emerald-100 text-emerald-700' },
  sold: { label: 'Vendu', color: 'bg-red-100 text-red-700' },
  rented: { label: 'Loué', color: 'bg-amber-100 text-amber-700' },
  pending: { label: 'En attente', color: 'bg-slate-100 text-slate-600' },
}

const verificationConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'En attente', variant: 'warning', icon: Clock },
  approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
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
      toast({ title: 'Bien supprimé', variant: 'success' })
    } catch {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const stats = {
    total: properties.length,
    pending: properties.filter(p => p.verification_status === 'pending').length,
    approved: properties.filter(p => p.verification_status === 'approved').length,
    rejected: properties.filter(p => p.verification_status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes biens</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.total} biens | {stats.approved} approuvés | {stats.pending} en attente
          </p>
        </div>
        <Link to="/dashboard/add-property">
          <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </Link>
      </div>

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Clock className="w-5 h-5" />
            <p className="text-sm font-medium">
              {stats.pending} bien{stats.pending > 1 ? 's' : ''} en attente de vérification. Les biens seront publiés après approbation.
            </p>
          </div>
        </div>
      )}

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
            const verification = verificationConfig[property.verification_status as VerificationStatus] || verificationConfig.pending
            const VerificationIcon = verification.icon
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
                      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                        <img src={img} alt={property.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{property.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold", status.color)}>
                            {status.label}
                          </span>
                          <Badge variant={verification.variant} className={cn(
                            "text-[10px] px-1.5",
                            verification.variant === 'default' && "bg-emerald-600"
                          )}>
                            <VerificationIcon className="w-3 h-3 mr-1" />
                            {verification.label}
                          </Badge>
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
                        {property.verification_status === 'rejected' && property.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
                            Raison du refus: {property.rejection_reason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link to={`/properties/${property.id}`}>
                          <Button variant="ghost" size="sm" className="cursor-pointer" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {property.verification_status !== 'approved' && (
                          <Button variant="ghost" size="sm" className="cursor-pointer" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleDelete(property.id)}
                          disabled={deleting === property.id}
                          title="Supprimer"
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