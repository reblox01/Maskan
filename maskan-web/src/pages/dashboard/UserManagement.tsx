import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Shield, UserCheck, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/types'

export default function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editDialog, setEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editVerified, setEditVerified] = useState(false)
  const [editActive, setEditActive] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchUsers()
  }, [user])

  const fetchUsers = () => {
    setLoading(true)
    api.get('/auth/users/')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
    agent: { label: 'Agent', color: 'bg-blue-100 text-blue-700' },
    client: { label: 'Client', color: 'bg-slate-100 text-slate-600' },
  }

  const openEdit = (u: AdminUser) => {
    setEditingUser(u)
    setEditRole(u.role)
    setEditVerified(u.is_verified)
    setEditActive(u.is_active)
    setEditDialog(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSubmitting(true)
    try {
      await api.patch(`/auth/users/${editingUser.id}/`, {
        role: editRole,
        is_verified: editVerified,
        is_active: editActive,
      })
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: editRole as AdminUser['role'], is_verified: editVerified, is_active: editActive } : u))
      toast({ title: 'Utilisateur mis à jour', variant: 'success' })
      setEditDialog(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/auth/users/${id}/`)
      setUsers(prev => prev.filter(u => u.id !== id))
      setDeleteConfirm(null)
      toast({ title: 'Utilisateur supprimé', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' })
    }
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-12"><p className="text-slate-500">Accès réservé aux administrateurs</p></div>
  }

  const stats = [
    { label: 'Total', value: users.length, icon: Users, color: 'bg-teal-50 text-teal-700' },
    { label: 'Vendeurs', value: users.filter(u => u.role === 'vendeur').length, icon: UserCheck, color: 'bg-blue-50 text-blue-700' },
    { label: 'Acquereurs', value: users.filter(u => u.role === 'acquereur').length, icon: Users, color: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les comptes utilisateurs de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'admin', 'agent', 'client'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                roleFilter === r ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {r === 'all' ? 'Tous' : roleConfig[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-card"><CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => {
            const rc = roleConfig[u.role] || roleConfig.client
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-0 shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", u.is_active ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-400")}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{u.username}</p>
                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold", rc.color)}>{rc.label}</span>
                          {u.is_verified && <Badge variant="success" className="text-[10px]">Vérifié</Badge>}
                          {!u.is_active && <Badge variant="destructive" className="text-[10px]">Désactivé</Badge>}
                          {u.developer_mode && <Badge variant="secondary" className="text-[10px]">Dev Mode</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.email} · {u.phone}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="cursor-pointer text-blue-600 hover:bg-blue-50" onClick={() => openEdit(u)}>
                          <Shield className="w-4 h-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="sm" className="cursor-pointer text-red-600 hover:bg-red-50" onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Aucun utilisateur trouvé</p></div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>{editingUser?.username} ({editingUser?.email})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Rôle</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Vérifié</Label>
              <Switch checked={editVerified} onCheckedChange={setEditVerified} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Compte actif</Label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="cursor-pointer">Annuler</Button>
            <Button onClick={handleSave} disabled={submitting} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet utilisateur ?</DialogTitle>
            <DialogDescription>Cette action est irréversible. Toutes les données associées seront supprimées.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="cursor-pointer">Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="cursor-pointer">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
