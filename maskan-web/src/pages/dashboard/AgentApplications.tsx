import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Check, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AgentApplication } from '@/types'

export default function AgentApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<AgentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedApp, setSelectedApp] = useState<AgentApplication | null>(null)
  const [reviewDialog, setReviewDialog] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    setLoading(true)
    api.get('/auth/agent-applications/', { params: { status: statusFilter } })
      .then(res => setApplications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [user, statusFilter])

  const handleReview = async () => {
    if (!selectedApp) return
    setSubmitting(true)
    try {
      await api.patch(`/auth/agent-applications/${selectedApp.id}/`, {
        status: reviewAction,
        admin_notes: reviewNotes,
      })
      toast({
        title: reviewAction === 'approved' ? 'Demande approuvée' : 'Demande refusée',
        description: `La demande de ${selectedApp.user.username} a été ${reviewAction === 'approved' ? 'approuvée' : 'refusée'}.`,
        variant: reviewAction === 'approved' ? 'success' : 'default',
      })
      setApplications(prev => prev.filter(a => a.id !== selectedApp.id))
      setReviewDialog(false)
      setSelectedApp(null)
      setReviewNotes('')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de traiter la demande', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openReview = (app: AgentApplication, action: 'approved' | 'rejected') => {
    setSelectedApp(app)
    setReviewAction(action)
    setReviewNotes('')
    setReviewDialog(true)
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-12"><p className="text-slate-500">Accès réservé aux administrateurs</p></div>
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approuvé', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          Demandes d'agent
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les demandes d'inscription en tant qu'agent</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              statusFilter === s ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {s === 'all' ? 'Toutes' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>
      ) : applications.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucune demande</h3>
            <p className="text-sm text-slate-500">Aucune demande avec le filtre sélectionné</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app, i) => {
            const sc = statusConfig[app.status] || statusConfig.pending
            return (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {app.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{app.user.username}</p>
                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold", sc.color)}>{sc.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{app.user.email} · {new Date(app.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {app.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => openReview(app, 'approved')}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 cursor-pointer" onClick={() => openReview(app, 'rejected')}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approved' ? 'Approuver' : 'Refuser'} la demande</DialogTitle>
            <DialogDescription>
              Demande de {selectedApp?.user.username} ({selectedApp?.user.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewAction === 'rejected' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Raison du refus</label>
                <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Expliquez pourquoi la demande est refusée..." rows={3} />
              </div>
            )}
            {reviewAction === 'approved' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
                <p>Cet utilisateur deviendra agent et pourra publier des biens immobiliers.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)} className="cursor-pointer">Annuler</Button>
            <Button onClick={handleReview} disabled={submitting} className={cn("cursor-pointer", reviewAction === 'approved' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
              {submitting ? 'Traitement...' : reviewAction === 'approved' ? 'Approuver' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
