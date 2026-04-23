import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, BarChart3, Heart,
  User, Settings, LogOut, Menu, X, ChevronRight,
  Home, PanelLeftClose, PanelLeft, UserPlus, ClipboardList, ToggleLeft,
  ShieldCheck, ArrowLeftRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Accès restreint</h2>
          <p className="text-slate-500 mb-4">Connectez-vous pour accéder à votre tableau de bord</p>
          <Link to="/login"><Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer">Se connecter</Button></Link>
        </div>
      </div>
    )
  }

  const role = user.role
  const currentMode = user.current_mode || role
  const isAdmin = role === 'admin'
  const isVendeur = role === 'vendeur'
  const isVendeurActive = currentMode === 'vendeur'

  const effectiveMode = isAdmin ? 'admin' : currentMode

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', modes: ['admin', 'vendeur', 'acquereur'] },
    { to: '/dashboard/properties', icon: Building2, label: 'Mes biens', modes: ['admin', 'vendeur'] },
    { to: '/dashboard/add-property', icon: Building2, label: 'Ajouter un bien', modes: ['admin', 'vendeur'] },
    { to: '/dashboard/saved', icon: Heart, label: 'Favoris', modes: ['acquereur', 'admin'] },
    { to: '/dashboard/stats', icon: BarChart3, label: 'Statistiques', modes: ['admin', 'vendeur'] },
    { to: '/dashboard/become-vendeur', icon: UserPlus, label: 'Devenir vendeur', modes: ['acquereur'] },
  ].filter(item => item.modes.includes(effectiveMode))

  const adminItems = [
    { to: '/dashboard/user-management', icon: Users, label: 'Utilisateurs', modes: ['admin'] },
    { to: '/dashboard/vendeur-applications', icon: ClipboardList, label: 'Candidatures', modes: ['admin'] },
    { to: '/dashboard/property-verification', icon: ShieldCheck, label: 'Vérification biens', modes: ['admin'] },
    { to: '/dashboard/application-fields', icon: ToggleLeft, label: 'Config. champs', modes: ['admin'] },
  ].filter(item => item.modes.includes(effectiveMode))

  const accountItems = [
    { to: '/dashboard/profile', icon: User, label: 'Mon profil' },
    { to: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
  ]

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  const handleSwitchRole = async () => {
    if (!isVendeur) return
    try {
      const newMode = user.current_mode === 'vendeur' ? 'acquereur' : 'vendeur'
      await api.post('/auth/switch-role/', { mode: newMode })
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch role:', err)
    }
  }

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrateur'
    if (role === 'vendeur') {
      if (user.current_mode === 'vendeur') return 'Vendeur'
      return 'Acquereur'
    }
    return 'Acquereur'
  }

  const SidebarNavItem = ({ item, collapsed }: { item: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }; collapsed: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.to, item.to === '/dashboard')

    const content = (
      <Link
        to={item.to}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="ml-1">{item.label}</TooltipContent>
        </Tooltip>
      )
    }
    return content
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="pt-2 px-4 pb-4 shrink-0">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.username}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-500">{getRoleLabel()}</p>
                {role === 'vendeur' && (
                  <Badge
                    variant={isVendeurActive ? 'default' : 'secondary'}
                    className={cn("text-[9px] px-1 py-0", isVendeurActive && "bg-teal-700")}
                  >
                    {isVendeurActive ? 'Actif' : 'Inactif'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="shrink-0" />

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && <p className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>}
        {navItems.map((item) => <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />)}

        {adminItems.length > 0 && (
          <>
            <Separator className="my-3 shrink-0" />
            {!collapsed && <p className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Administration</p>}
            {adminItems.map((item) => <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />)}
          </>
        )}

        <Separator className="my-3 shrink-0" />
        {!collapsed && <p className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Compte</p>}
        {accountItems.map((item) => <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />)}

        {isVendeur && (
          <button
            onClick={handleSwitchRole}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer w-full",
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
              "text-teal-700 hover:bg-teal-50"
            )}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <span>
                {isVendeurActive ? 'Passer en mode Acquereur' : 'Passer en mode Vendeur'}
              </span>
            )}
          </button>
        )}
      </nav>

      <Separator className="shrink-0" />

      <div className="p-3 space-y-1 shrink-0">
        <SidebarNavItem item={{ to: '/', icon: Home, label: 'Retour au site' }} collapsed={collapsed} />
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full cursor-pointer transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex">
        {/* Desktop sidebar */}
        <aside className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 fixed left-0 top-16 bottom-0 overflow-hidden transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "z-40"
        )}>
          {sidebar}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors z-50"
          >
            {collapsed ? <PanelLeft className="w-3.5 h-3.5 text-slate-500" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 w-64 bg-white border-r border-slate-200 h-full z-50 lg:hidden overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <span className="text-lg font-bold text-teal-900">Menu</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="h-[calc(100vh-4rem)] overflow-y-auto">
                  {sidebar}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className={cn("flex-1 min-w-0", collapsed ? "lg:ml-16" : "lg:ml-64")}>
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              <Menu className="w-5 h-5" /> Menu
            </button>
          </div>
          <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
        </main>
      </div>
  )
}