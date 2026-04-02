import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Eye, Users, Building2, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function DashboardStats() {
  const [loading] = useState(false)

  const chartData = [
    { month: 'Jan', views: 1200, contacts: 45 },
    { month: 'Fév', views: 1800, contacts: 62 },
    { month: 'Mar', views: 2400, contacts: 89 },
    { month: 'Avr', views: 2100, contacts: 73 },
    { month: 'Mai', views: 3200, contacts: 110 },
    { month: 'Juin', views: 2800, contacts: 95 },
    { month: 'Juil', views: 3500, contacts: 128 },
    { month: 'Août', views: 3100, contacts: 105 },
  ]

  const maxViews = Math.max(...chartData.map(d => d.views))

  const topProperties = [
    { title: 'Villa à Palmeraie', views: 842, contacts: 23 },
    { title: 'Appartement F3 Californie', views: 654, contacts: 18 },
    { title: 'Studio Gueliz', views: 521, contacts: 15 },
    { title: 'Bureau Agadir', views: 312, contacts: 8 },
    { title: 'Terrain Bouskoura', views: 198, contacts: 4 },
  ]

  if (loading) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques</h1>
        <p className="text-sm text-slate-500 mt-1">Analysez les performances de vos biens</p>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vues totales', value: '12.4K', change: '+23%', icon: Eye, color: 'bg-teal-50 text-teal-700' },
          { label: 'Contacts', value: '284', change: '+15%', icon: Users, color: 'bg-blue-50 text-blue-700' },
          { label: 'Biens actifs', value: '24', change: '+3', icon: Building2, color: 'bg-amber-50 text-amber-700' },
          { label: 'Taux conversion', value: '2.3%', change: '+0.4%', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-medium text-emerald-600">{s.change}</span>
                  <span className="text-xs text-slate-400">ce mois</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Vues par mois</h3>
              <p className="text-xs text-slate-500">Évolution des visites sur 8 mois</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" /> Jan — Août 2026
            </div>
          </div>

          <div className="flex items-end gap-2 h-48">
            {chartData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-medium">{(d.views / 1000).toFixed(1)}K</span>
                <motion.div
                  className="w-full rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 hover:from-teal-700 hover:to-teal-500 transition-colors cursor-pointer"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.views / maxViews) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  title={`${d.month}: ${d.views} vues, ${d.contacts} contacts`}
                />
                <span className="text-[10px] text-slate-400">{d.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Properties */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Biens les plus consultés</h3>
          <div className="space-y-3">
            {topProperties.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.contacts}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
