import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, Users, Eye, TrendingUp, ArrowUpRight, ArrowDownRight,
  Clock, MapPin, Plus, BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useDeveloperMode } from '@/hooks/useDeveloperMode'
import { mockDashboardStats, mockRecentActivity } from '@/lib/mockData'
import { formatPrice, cn } from '@/lib/utils'

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-card"><CardContent className="p-5">
      <div className="flex items-start justify-between"><Skeleton className="w-10 h-10 rounded-xl" /><Skeleton className="w-12 h-5 rounded-md" /></div>
      <div className="mt-4 space-y-1.5"><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-28" /></div>
    </CardContent></Card>
  )
}

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth()
  const { enabled: devMode } = useDeveloperMode()
  const role = user?.role || 'client'

  const icons: Record<string, React.ReactNode> = {
    'Total biens': <Building2 className="w-5 h-5" />,
    'Utilisateurs': <Users className="w-5 h-5" />,
    'Vues ce mois': <Eye className="w-5 h-5" />,
    'Revenus': <TrendingUp className="w-5 h-5" />,
    'Mes biens': <Building2 className="w-5 h-5" />,
    'Vues totales': <Eye className="w-5 h-5" />,
    'Demandes': <Users className="w-5 h-5" />,
    'Vendus': <TrendingUp className="w-5 h-5" />,
    'Biens sauvegardés': <Building2 className="w-5 h-5" />,
    'Recherches': <BarChart3 className="w-5 h-5" />,
    'Alertes actives': <Clock className="w-5 h-5" />,
  }

  const iconColors: Record<string, string> = {
    'Total biens': 'bg-teal-50 text-teal-700',
    'Utilisateurs': 'bg-blue-50 text-blue-700',
    'Vues ce mois': 'bg-amber-50 text-amber-700',
    'Revenus': 'bg-emerald-50 text-emerald-700',
    'Mes biens': 'bg-teal-50 text-teal-700',
    'Vues totales': 'bg-blue-50 text-blue-700',
    'Demandes': 'bg-amber-50 text-amber-700',
    'Vendus': 'bg-emerald-50 text-emerald-700',
    'Biens sauvegardés': 'bg-teal-50 text-teal-700',
    'Recherches': 'bg-blue-50 text-blue-700',
    'Alertes actives': 'bg-amber-50 text-amber-700',
  }

  const currentStats = devMode
    ? mockDashboardStats[role] || mockDashboardStats.client
    : mockDashboardStats[role] || mockDashboardStats.client // In production, fetch from API

  const activity = devMode ? mockRecentActivity : mockRecentActivity.slice(0, 3)

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {user?.username} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Voici un aperçu de votre activité récente</p>
        </div>
        {(role === 'agent' || role === 'admin') && (
          <Link to="/dashboard/add-property">
            <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer"><Plus className="w-4 h-4 mr-2" />Ajouter un bien</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentStats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColors[stat.title] || 'bg-slate-100 text-slate-600')}>
                    {icons[stat.title] || <Building2 className="w-5 h-5" />}
                  </div>
                  {stat.trend && stat.change && (
                    <Badge variant={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Activité récente</h3>
              <Button variant="ghost" size="sm" className="text-xs text-teal-700 cursor-pointer">Voir tout</Button>
            </div>
            <div className="space-y-4">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.type === 'property' ? 'bg-teal-50 text-teal-600' :
                    item.type === 'request' ? 'bg-blue-50 text-blue-600' :
                    item.type === 'sale' ? 'bg-emerald-50 text-emerald-600' :
                    item.type === 'user' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  )}>
                    {item.type === 'property' ? <Building2 className="w-4 h-4" /> :
                     item.type === 'request' ? <Users className="w-4 h-4" /> :
                     item.type === 'sale' ? <TrendingUp className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{item.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {role === 'client' ? 'Biens recommandés' : 'Performances'}
            </h3>
            {role === 'client' ? (
              <div className="space-y-3">
                {[
                  { title: 'Appartement F3 à Californie', city: 'Casablanca', price: 1800000 },
                  { title: 'Villa à Palmeraie', city: 'Marrakech', price: 8500000 },
                  { title: 'Studio à Gueliz', city: 'Marrakech', price: 450000 },
                ].map((p, i) => (
                  <Link key={i} to="/properties" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" />{p.city}</div>
                    </div>
                    <p className="text-sm font-semibold text-teal-700 flex-shrink-0 ml-3">{formatPrice(p.price)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Vues cette semaine', value: devMode ? '48.2K' : '847', pct: devMode ? 85 : 72 },
                  { label: 'Demandes de contact', value: devMode ? '342' : '23', pct: devMode ? 68 : 45 },
                  { label: 'Biens consultés', value: devMode ? '2 847' : '156', pct: devMode ? 92 : 88 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm text-slate-600">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-teal-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
