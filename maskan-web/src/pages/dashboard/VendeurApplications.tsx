import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Check, X, Eye, Loader2, AlertCircle, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import type { VendeurApplication, VerificationStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'destructive' | 'warning' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  approved: { label: 'Approuvé', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
}

export default function VendeurApplications() {
  const [applications, setApplications] = useState<VendeurApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('pending')
  const [selectedApp, setSelectedApp] = useState<VendeurApplication | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await api.get(`/auth/vendeur-applications/?${params}`)
      setApplications(response.data.results || response.data || [])
    } catch {
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const openApplicationDetail = async (id: string) => {
    setDetailLoading(true)
    setSelectedApp(null)
    setAdminNotes('')
    setDialogOpen(true)
    try {
      const response = await api.get(`/auth/vendeur-applications/${id}/`)
      setSelectedApp(response.data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les détails', variant: 'destructive' })
      setDialogOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedApp) return
    setActionLoading(true)
    try {
      await api.patch(`/auth/vendeur-applications/${selectedApp.id}/`, {
        status,
        admin_notes: adminNotes,
      })
      toast({
        title: status === 'approved' ? 'Candidature approuvée' : 'Candidature refusée',
        description: status === 'approved'
          ? 'L\'utilisateur peut maintenant devenir vendeur.'
          : 'L\'utilisateur a été notifié du refus.',
        variant: 'success',
      })
      setDialogOpen(false)
      fetchApplications()
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            Candidatures vendeurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Examinez les demandes pour devenir vendeur
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

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune candidature</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const config = statusConfig[app.status]
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openApplicationDetail(app.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{app.user.username}</h3>
                            <p className="text-sm text-slate-500">{app.user.email}</p>
                          </div>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                          Soumise le {new Date(app.created_at).toLocaleDateString('fr-MA')}
                        </p>
                        {app.admin_notes && (
                          <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg p-2">
                            Notes: {app.admin_notes}
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
        <DialogContent className="max-w-lg">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            </div>
          ) : selectedApp ? (
            <>
              <DialogHeader>
                <DialogTitle>Candidature de {selectedApp.user.username}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedApp.user.username}</span>
                  </div>
                  <p className="text-sm text-slate-500">{selectedApp.user.email}</p>
                  <p className="text-sm text-slate-400">{selectedApp.user.phone || 'Pas de téléphone'}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">Réponses au formulaire</h4>
                  {selectedApp.responses.map((resp) => (
                    <div key={resp.id} className="space-y-1">
                      <p className="text-sm text-slate-500">{resp.field.label}</p>
                      <p className="text-sm font-medium bg-slate-50 rounded-lg p-2">{resp.value || '-'}</p>
                    </div>
                  ))}
                </div>

                {selectedApp.status === 'pending' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes (optionnel)</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ajoutez une note pour l'utilisateur..."
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedApp.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleReview('rejected')}
                      disabled={actionLoading}
                      className="cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                      Refuser
                    </Button>
                    <Button
                      onClick={() => handleReview('approved')}
                      disabled={actionLoading}
                      className="bg-teal-700 hover:bg-teal-800 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Approuver
                    </Button>
                  </>
                )}
                {selectedApp.status !== 'pending' && (
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