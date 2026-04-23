import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Check, X, Eye, Loader2, Building2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import type { PropertyAdminItem, PropertyAdminDetail, VerificationStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'destructive' | 'warning' | 'secondary'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'En attente', variant: 'warning', icon: Loader2 },
  approved: { label: 'Approuvé', variant: 'default', icon: Check },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: X },
}

export default function PropertyVerification() {
  const [properties, setProperties] = useState<PropertyAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('pending')
  const [selectedProperty, setSelectedProperty] = useState<PropertyAdminDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [statusFilter])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await api.get(`/properties/pending-verification/?${params}`)
      setProperties(response.data.results || [])
    } catch {
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const openPropertyDetail = async (id: string) => {
    setDetailLoading(true)
    setSelectedProperty(null)
    setRejectReason('')
    setDialogOpen(true)
    try {
      const response = await api.get(`/properties/${id}/verify/`)
      setSelectedProperty(response.data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les détails', variant: 'destructive' })
      setDialogOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleVerification = async (action: 'approve' | 'reject') => {
    if (!selectedProperty) return
    if (action === 'reject' && !rejectReason.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez fournir une raison pour le rejet', variant: 'destructive' })
      return
    }

    setActionLoading(true)
    try {
      await api.patch(`/properties/${selectedProperty.id}/verify/`, {
        action,
        rejection_reason: action === 'reject' ? rejectReason : '',
      })
      toast({
        title: action === 'approve' ? 'Bien approuvé' : 'Bien rejeté',
        description: action === 'approve'
          ? 'Le bien est maintenant visible publiquement.'
          : 'Le vendeur a été notifié du rejet.',
        variant: 'success',
      })
      setDialogOpen(false)
      fetchProperties()
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const pendingCount = properties.filter(p => p.verification_status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Vérification des biens
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Examinez et vérifiez les biens avant qu'ils ne soient publiés
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1">
            {pendingCount} en attente
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className={cn(
              statusFilter === status && "bg-teal-700 hover:bg-teal-800"
            )}
          >
            {status === 'all' ? 'Tous' : statusConfig[status].label}
          </Button>
        ))}
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      ) : properties.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun bien à vérifier</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {properties.map((property) => {
            const config = statusConfig[property.verification_status]
            const StatusIcon = config.icon
            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openPropertyDetail(property.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 truncate">{property.title}</h3>
                            <p className="text-sm text-slate-500">{property.city}, {property.region}</p>
                          </div>
                          <Badge variant={config.variant} className="flex-shrink-0">
                            <StatusIcon className={cn("w-3 h-3 mr-1", property.verification_status === 'pending' && "animate-spin")} />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span>{property.property_type}</span>
                          <span>{Number(property.price).toLocaleString('fr-MA')} {property.currency}</span>
                          <span>{property.agent_name}</span>
                        </div>
                        {property.verification_status === 'rejected' && property.rejection_reason && (
                          <p className="text-sm text-red-600 mt-2 bg-red-50 rounded-lg p-2">
                            Raison: {property.rejection_reason}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            </div>
          ) : selectedProperty ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedProperty.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-500">Type</p>
                    <p className="font-medium capitalize">{selectedProperty.property_type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Prix</p>
                    <p className="font-medium">{Number(selectedProperty.price).toLocaleString('fr-MA')} {selectedProperty.currency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Surface</p>
                    <p className="font-medium">{selectedProperty.area_sqm} m²</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Chambres / SDB</p>
                    <p className="font-medium">{selectedProperty.bedrooms} / {selectedProperty.bathrooms}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500">Localisation</p>
                  <p className="font-medium">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.region}</p>
                </div>

                {selectedProperty.description && (
                  <div className="space-y-1">
                    <p className="text-slate-500">Description</p>
                    <p className="font-medium text-sm">{selectedProperty.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-500">Vendeur</p>
                    <p className="font-medium">{selectedProperty.agent.username}</p>
                    <p className="text-slate-400">{selectedProperty.agent.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500">Statut actuel</p>
                    <Badge variant={statusConfig[selectedProperty.verification_status].variant}>
                      {statusConfig[selectedProperty.verification_status].label}
                    </Badge>
                  </div>
                </div>

                {/* Images */}
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-sm">Photos ({selectedProperty.images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProperty.images.slice(0, 4).map((img) => (
                        <div key={img.id} className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
                          <img
                            src={`data:image/jpeg;base64,${img.image_data}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason Input */}
                {selectedProperty.verification_status !== 'approved' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Raison du rejet (obligatoire pour rejeter)
                    </label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Expliquez pourquoi ce bien est rejeté..."
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedProperty.verification_status !== 'approved' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleVerification('reject')}
                    disabled={actionLoading}
                    className="cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                    Rejeter
                  </Button>
                )}
                {selectedProperty.verification_status !== 'approved' && (
                  <Button
                    onClick={() => handleVerification('approve')}
                    disabled={actionLoading}
                    className="bg-teal-700 hover:bg-teal-800 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Approuver
                  </Button>
                )}
                {selectedProperty.verification_status === 'approved' && (
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                    Fermer
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}