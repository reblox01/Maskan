import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Home, User, LogOut, Settings, LayoutDashboard, Building2,
  ChevronDown, Search, TrendingUp, Heart, Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Acheter',
    to: '/properties?type=buy',
    children: [
      { label: 'Appartements', to: '/properties?type=buy&property_type=apartment', icon: Building2 },
      { label: 'Villas', to: '/properties?type=buy&property_type=villa', icon: Building },
      { label: 'Studios', to: '/properties?type=buy&property_type=studio', icon: Home },
      { label: 'Locaux commerciaux', to: '/properties?type=buy&property_type=commercial', icon: TrendingUp },
    ],
  },
  {
    label: 'Louer',
    to: '/properties?type=rent',
    children: [
      { label: 'Appartements', to: '/properties?type=rent&property_type=apartment', icon: Building2 },
      { label: 'Studios', to: '/properties?type=rent&property_type=studio', icon: Home },
      { label: 'Bureaux', to: '/properties?type=rent&property_type=office', icon: Building },
    ],
  },
  { label: 'Immobilier neuf', to: '/properties?type=new' },
  { label: 'Estimer', to: '/estimate' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  if (location.pathname.startsWith('/dashboard')) return null

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-900 tracking-tight">Maskan</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) =>
              item.children ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors duration-200 cursor-pointer">
                      {item.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-2">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.label} asChild>
                        <Link to={child.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                          <child.icon className="w-4 h-4 text-teal-600" />
                          <span>{child.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={item.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-teal-700 font-medium">
                        <Search className="w-4 h-4" />
                        <span>Voir tout</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer",
                    location.pathname + location.search === item.to ? "text-teal-700 bg-teal-50" : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    <Avatar className="w-8 h-8">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-slate-900 leading-tight">{user.username}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{user.role === 'admin' ? 'Admin' : user.role === 'agent' ? 'Agent' : 'Client'}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel className="px-3 py-1.5">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>Tableau de bord</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/saved" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                      <Heart className="w-4 h-4 text-slate-500" />
                      <span>Favoris</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-700">
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm" className="cursor-pointer">Se connecter</Button></Link>
                <Link to="/register"><Button size="sm" className="bg-teal-700 hover:bg-teal-800 cursor-pointer shadow-sm">Créer un compte</Button></Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-slate-200 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer">
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 mt-2">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start cursor-pointer"><LayoutDashboard className="w-4 h-4 mr-2" />Tableau de bord</Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start cursor-pointer text-red-600" onClick={() => { logout(); setMobileOpen(false) }}>
                      <LogOut className="w-4 h-4 mr-2" />Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full cursor-pointer">Se connecter</Button></Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}><Button className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer">Créer un compte</Button></Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
