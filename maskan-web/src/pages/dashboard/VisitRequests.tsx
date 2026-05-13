import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Calendar, Check, X, Clock, User, ExternalLink, MapPin, Ban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getMyVisitRequests, updateVisitStatus } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { VisitRequest } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' | 'default'; dot: string }> = {
  pending: { label: 'En attente', variant: 'warning', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmé', variant: 'success', dot: 'bg-emerald-500' },
  completed: { label: 'Terminé', variant: 'default', dot: 'bg-blue-500' },
  cancelled: { label: 'Annulé', variant: 'secondary', dot: 'bg-slate-400' },
  rejected: { label: 'Refusé', variant: 'destructive', dot: 'bg-red-500' },
}

function SkeletonCard() {
  return (
    <Card className="border-0 shadow-card"><CardContent className="p-4 space-y-3">
      <Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-32" /><Skeleton className="h-8 w-full rounded-lg" />
    </CardContent></Card>
  )
}

export default function VisitRequests() {
  const { user } = useAuth()
  const [visits, setVisits] = useState<VisitRequest[]>([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const isVendeur = user?.role === 'vendeur' || user?.role === 'admin'

  const fetchVisits = useCallback(async () => {
    try {
      const data = await getMyVisitRequests()
      setVisits(data)
    } catch {
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVisits()
    const interval = setInterval(fetchVisits, 10000)
    return () => clearInterval(interval)
  }, [fetchVisits])

  useGSAP(() => {
    if (!listRef.current || loading) return
    const cards = listRef.current.querySelectorAll('.visit-card')
    gsap.fromTo(cards,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
    )
  }, [visits.length, loading])

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateVisitStatus(id, status)
      toast.success(`Demande ${status === 'confirmed' ? 'confirmée' : status === 'rejected' ? 'refusée' : 'mise à jour'}`)
      fetchVisits()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isVendeur ? 'Demandes de visite' : 'Mes demandes de visite'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {loading ? '...' : `${visits.length} demande${visits.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visits.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {isVendeur ? 'Aucune demande de visite' : 'Aucune visite planifiée'}
            </h3>
            <p className="text-sm text-slate-500">
              {isVendeur
                ? 'Les demandes de visite pour vos biens apparaîtront ici.'
                : 'Explorez les biens et demandez une visite.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visits.map((visit) => {
            const config = statusConfig[visit.status] || statusConfig.pending
            const isPending = visit.status === 'pending'

            return (
              <div key={visit.id} className="visit-card">
                <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className={cn("h-1", visit.status === 'confirmed' ? 'bg-emerald-500' : visit.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400')} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/properties/${visit.related_property?.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1.5 group"
                        >
                          {visit.related_property?.title || 'Bien'}
                          <ExternalLink className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {visit.related_property?.city || ''}
                        </div>
                      </div>
                      <Badge variant={config.variant} className="flex items-center gap-1.5 shrink-0">
                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 bg-slate-50 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(visit.scheduled_date)}</span>
                    </div>

                    {isVendeur && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{visit.client?.username || 'Client'}</span>
                        {visit.client?.phone && (
                          <span className="text-slate-400">· {visit.client.phone}</span>
                        )}
                      </div>
                    )}

                    {visit.notes && (
                      <p className="text-xs text-slate-500 mb-3 italic bg-slate-50 rounded-lg px-3 py-2">
                        "{visit.notes}"
                      </p>
                    )}

                    {isVendeur && isPending && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-all active:scale-95"
                          onClick={() => handleStatus(visit.id, 'confirmed')}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 cursor-pointer transition-all active:scale-95"
                          onClick={() => handleStatus(visit.id, 'rejected')}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Refuser
                        </Button>
                      </div>
                    )}

                    {visit.status === 'pending' && !isVendeur && (
                      <div className="pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleStatus(visit.id, 'cancelled')}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" /> Annuler la demande
                        </Button>
                      </div>
                    )}

                    {isVendeur && visit.status === 'confirmed' && (
                      <div className="pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleStatus(visit.id, 'cancelled')}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" /> Annuler la visite
                        </Button>
                      </div>
                    )}

                    {!isVendeur && visit.status === 'rejected' && (
                      <p className="text-xs text-amber-600 text-center pt-2 border-t border-slate-100">
                        Vous pouvez renouveler votre demande avec une nouvelle date.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
