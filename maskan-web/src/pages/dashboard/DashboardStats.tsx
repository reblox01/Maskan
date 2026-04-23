import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building2, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface StatsData {
  properties_count: number
  properties_this_month: number
  published_count: number
  published_this_month: number
  pending_count: number
  rejected_count: number
  pending_verification: number
  saved_count: number
  saved_this_month: number
  users_count: number
  users_this_month: number
  properties_growth: number
  users_growth: number
  pending_applications: number
  recent_properties: { id: string; title: string; status: string; created_at: string }[]
}

export default function DashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin'
  const currentMode = user?.current_mode || user?.role || 'acquereur'

  useEffect(() => {
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await api.get('/auth/dashboard-stats/')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-56 mt-1.5" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-card"><CardContent className="p-4 space-y-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent></Card>
          ))}
        </div>
        <Card className="border-0 shadow-card"><CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent></Card>
      </div>
    )
  }

  const renderStatValue = (stat: { value: number; change?: number | null; growth?: number; label: string }) => {
    if (stat.growth !== undefined) {
      return (
        <>
          <Badge variant={stat.growth >= 0 ? 'success' : 'destructive'} className="text-[10px]">
            {stat.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(stat.growth)}%
          </Badge>
        </>
      )
    }
    if (stat.change !== null && stat.change !== undefined) {
      return <span className="text-xs font-medium text-teal-600">+{stat.change} ce mois</span>
    }
    return <span className="text-xs text-slate-400">{stat.label}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin ? 'Analysez les performances de votre plateforme' : currentMode === 'vendeur' ? 'Analysez les performances de vos biens' : 'Analysez votre activité'}
        </p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Utilisateurs', value: stats.users_count, growth: stats.users_growth },
            { label: 'Total biens', value: stats.properties_count, growth: stats.properties_growth },
            { label: 'Publiés', value: stats.published_count, change: null },
            { label: 'En attente', value: stats.pending_verification, change: null },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", i === 0 ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700')}>
                    {i === 0 ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {renderStatValue(s)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {currentMode === 'vendeur' && !isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Mes biens', value: stats.properties_count, change: stats.properties_this_month },
            { label: 'Publiés', value: stats.published_count, change: stats.published_this_month },
            { label: 'En attente', value: stats.pending_count, change: null },
            { label: 'Rejetés', value: stats.rejected_count, change: null },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", i === 0 ? 'bg-teal-50 text-teal-700' : i === 1 ? 'bg-emerald-50 text-emerald-700' : i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {renderStatValue(s)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {currentMode === 'acquereur' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-teal-50 text-teal-700">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-slate-900">{stats.saved_count}</p>
              <p className="text-xs text-slate-500 mt-0.5">Biens sauvegardés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Candidatures en attente</h3>
                  <p className="text-xs text-slate-500">Demandes de vendeur</p>
                </div>
                <Badge variant="outline">{stats.pending_applications || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Répartition des biens</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-600">Publiés</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{stats.published_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-600">En attente</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{stats.pending_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-600">Rejetés</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{stats.rejected_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentMode === 'vendeur' && !isAdmin && stats.recent_properties?.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Mes biens</h3>
            <div className="space-y-3">
              {stats.recent_properties.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Badge 
                    className={cn(
                      "text-[10px]",
                      p.status === 'approved' && "bg-emerald-100 text-emerald-700",
                      p.status === 'pending' && "bg-amber-100 text-amber-700",
                      p.status === 'rejected' && "bg-red-100 text-red-700"
                    )}
                  >
                    {p.status === 'approved' ? 'Publié' : p.status === 'pending' ? 'En attente' : 'Rejeté'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentMode === 'acquereur' && stats.saved_count > 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Votre activité</h3>
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                Vous avez sauvegardé {stats.saved_count} biens {stats.saved_this_month > 0 && `(+{stats.saved_this_month} ce mois)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}