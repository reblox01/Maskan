import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Building2, Users, Clock, Plus, Heart, Search, 
  TrendingUp, TrendingDown, Calendar 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface DashboardStats {
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

type GrowthStat = { title: string; value: number; change?: number | null; suffix?: string; prefix?: string }
type BasicStat = { title: string; value: number }

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-card"><CardContent className="p-5">
      <div className="flex items-start justify-between"><Skeleton className="w-10 h-10 rounded-xl" /><Skeleton className="w-12 h-5 rounded-md" /></div>
      <div className="mt-4 space-y-1.5"><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-28" /></div>
    </CardContent></Card>
  )
}

function RecentPropertySkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
    </div>
  )
}

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const currentMode = user?.current_mode || user?.role || 'acquereur'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user) return
    fetchDashboardData()
  }, [user, currentMode])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/auth/dashboard-stats/')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatsForMode = (): { growth: GrowthStat[]; basic: BasicStat[] } => {
    if (!stats) return { growth: [], basic: [] }

    if (isAdmin) {
      return {
        growth: [
          { title: 'Nouveaux utilisateurs', value: stats.users_this_month || 0, change: stats.users_growth, prefix: '', suffix: ' ce mois' },
          { title: 'Nouveaux biens', value: stats.properties_this_month || 0, change: stats.properties_growth, prefix: '', suffix: ' ce mois' },
        ],
        basic: [
          { title: 'Total utilisateurs', value: stats.users_count },
          { title: 'Total biens', value: stats.properties_count },
          { title: 'Biens en attente', value: stats.pending_verification },
          { title: 'Publiés', value: stats.published_count },
        ]
      }
    }

    if (currentMode === 'vendeur') {
      return {
        growth: [
          { title: 'Ajouts ce mois', value: stats.properties_this_month || 0, change: null },
          { title: 'Publiés ce mois', value: stats.published_this_month || 0, change: null },
        ],
        basic: [
          { title: 'Mes biens', value: stats.properties_count },
          { title: 'Publiés', value: stats.published_count },
          { title: 'En attente', value: stats.pending_count },
          { title: 'Rejetés', value: stats.rejected_count },
        ]
      }
    }

    return {
      growth: [
        { title: 'Sauvegardés ce mois', value: stats.saved_this_month || 0, change: null },
      ],
      basic: [
        { title: 'Biens sauvegardés', value: stats.saved_count },
      ]
    }
  }

  const icons: Record<string, React.ReactNode> = {
    'Total utilisateurs': <Users className="w-5 h-5" />,
    'Total biens': <Building2 className="w-5 h-5" />,
    'Biens en attente': <Clock className="w-5 h-5" />,
    'Publiés': <Building2 className="w-5 h-5" />,
    'Mes biens': <Building2 className="w-5 h-5" />,
    'En attente': <Clock className="w-5 h-5" />,
    'Rejetés': <Building2 className="w-5 h-5" />,
    'Biens sauvegardés': <Heart className="w-5 h-5" />,
    'Nouveaux utilisateurs': <Users className="w-5 h-5" />,
    'Nouveaux biens': <Building2 className="w-5 h-5" />,
    'Ajouts ce mois': <Plus className="w-5 h-5" />,
    'Publiés ce mois': <Building2 className="w-5 h-5" />,
    'Sauvegardés ce mois': <Heart className="w-5 h-5" />,
  }

  const iconColors: Record<string, string> = {
    'Total utilisateurs': 'bg-blue-50 text-blue-700',
    'Total biens': 'bg-teal-50 text-teal-700',
    'Biens en attente': 'bg-amber-50 text-amber-700',
    'Publiés': 'bg-emerald-50 text-emerald-700',
    'Mes biens': 'bg-teal-50 text-teal-700',
    'En attente': 'bg-amber-50 text-amber-700',
    'Rejetés': 'bg-red-50 text-red-700',
    'Biens sauvegardés': 'bg-teal-50 text-teal-700',
    'Nouveaux utilisateurs': 'bg-blue-50 text-blue-700',
    'Nouveaux biens': 'bg-teal-50 text-teal-700',
    'Ajouts ce mois': 'bg-teal-50 text-teal-700',
    'Publiés ce mois': 'bg-emerald-50 text-emerald-700',
    'Sauvegardés ce mois': 'bg-teal-50 text-teal-700',
  }

  const { growth, basic } = getStatsForMode()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Publié</Badge>
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 text-[10px]">En attente</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 text-[10px]">Rejeté</Badge>
      default: return null
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card"><CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => <RecentPropertySkeleton key={i} />)}
          </CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 2 }).map((_, i) => <RecentPropertySkeleton key={i} />)}
          </CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {user?.username} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? 'Voici un aperçu de votre plateforme' : currentMode === 'vendeur' ? 'Voici un aperçu de vos biens' : 'Voici un aperçu de votre activité'}
          </p>
        </div>
        {(currentMode === 'vendeur' || isAdmin) && (
          <Link to="/dashboard/add-property">
            <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer"><Plus className="w-4 h-4 mr-2" />Ajouter un bien</Button>
          </Link>
        )}
      </div>

      {growth.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {growth.map((stat: GrowthStat, i: number) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <Card className="border-0 shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColors[stat.title] || 'bg-slate-100 text-slate-600')}>
                      {icons[stat.title] || <Calendar className="w-5 h-5" />}
                    </div>
                    {stat.change != null && stat.change !== undefined && (
                      <Badge variant={stat.change >= 0 ? 'success' : 'destructive'} className="text-[10px]">
                        {stat.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(stat.change)}%
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-slate-900">
                      {stat.prefix}{stat.value}{stat.suffix}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {basic.map((stat: BasicStat, i: number) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (growth.length * 0.05) + i * 0.05, duration: 0.3 }}>
            <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <CardContent className="p-4">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", iconColors[stat.title] || 'bg-slate-100 text-slate-600')}>
                  {icons[stat.title] || <Building2 className="w-4 h-4" />}
                </div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {currentMode === 'vendeur' || isAdmin ? 'Biens récents' : 'Recommandations'}
              </h3>
            </div>
            {currentMode === 'acquereur' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 text-center py-4">
                  Explorez nos biens immobiliers disponibles
                </p>
                <Link to="/properties">
                  <Button variant="outline" className="w-full cursor-pointer">Voir les biens</Button>
                </Link>
              </div>
            ) : stats?.recent_properties?.length ? (
              <div className="space-y-2">
                {stats.recent_properties.map((p) => (
                  <Link key={p.id} to={`/dashboard/properties/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColors['Mes biens'])}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {getStatusBadge(p.status)}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">
                  {stats?.properties_count === 0 ? 'Aucun bien publié pour le moment' : 'Aucun bien récent'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {currentMode === 'acquereur' ? 'Actions rapides' : 'Gestion rapide'}
            </h3>
            <div className="space-y-2">
              {currentMode === 'acquereur' ? (
                <>
                  <Link to="/properties" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Rechercher un bien</span>
                    <Search className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/estimate" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Estimer mon bien</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard/properties" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Voir mes biens</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/dashboard/add-property" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Ajouter un nouveau bien</span>
                    <Plus className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/dashboard/stats" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Voir les statistiques</span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}