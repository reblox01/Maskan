import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Code, AlertTriangle, Lock, Eye, EyeOff, Save, Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import { useDeveloperMode } from '@/hooks/useDeveloperMode'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { user } = useAuth()
  const { enabled: devMode, toggle: toggleDevMode } = useDeveloperMode()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const handlePasswordChange = async () => {
    setError('')
    if (passwords.new_password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour.', variant: 'success' })
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
    } catch {
      setError('Erreur lors du changement de mot de passe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez la sécurité et les préférences de votre compte</p>
      </div>

      {user?.role === 'admin' && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", devMode ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>
                <Code className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Mode développeur</h3>
                  {devMode && <Badge variant="warning" className="text-[10px]">ACTIF</Badge>}
                </div>
                <p className="text-xs text-slate-500">Active les données fictives pour les démonstrations</p>
              </div>
              <Switch checked={devMode} onCheckedChange={toggleDevMode} />
            </div>

            {devMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Mode développeur activé</p>
                    <p className="text-xs text-amber-700 mt-1">Toutes les données affichées sur le tableau de bord sont fictives. Utilisez ce mode pour les présentations aux investisseurs.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Changer le mot de passe</h3>
              <p className="text-xs text-slate-500">Utilisez un mot de passe fort avec au moins 8 caractères</p>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">{error}</div>}

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Mot de passe actuel</Label>
              <div className="relative">
                <Input type={showCurrent ? 'text' : 'password'} value={passwords.current_password} onChange={(e) => setPasswords(prev => ({ ...prev, current_password: e.target.value }))} placeholder="••••••••" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Nouveau mot de passe</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} value={passwords.new_password} onChange={(e) => setPasswords(prev => ({ ...prev, new_password: e.target.value }))} placeholder="••••••••" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Confirmer le nouveau mot de passe</Label>
              <Input type="password" value={passwords.confirm_password} onChange={(e) => setPasswords(prev => ({ ...prev, confirm_password: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePasswordChange} disabled={saving} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              {saving ? 'Modification...' : <><Save className="w-4 h-4 mr-2" />Modifier</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card border-red-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Zone de danger</h3>
              <p className="text-xs text-red-500">Actions irréversibles sur votre compte</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Supprimer mon compte</p>
              <p className="text-xs text-slate-500">Cette action est irréversible</p>
            </div>
            <Button variant="destructive" size="sm" className="cursor-pointer">Supprimer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}