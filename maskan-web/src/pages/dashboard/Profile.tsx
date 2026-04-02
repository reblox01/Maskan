import { useState, useRef } from 'react'
import { User, Mail, Phone, Camera, Save, MapPin, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AvatarCropper from '@/components/AvatarCropper'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: user?.address || '',
    city: user?.city || '',
    region: user?.region || '',
  })

  if (!user) return null

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    agent: 'Agent immobilier',
    client: 'Client',
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (base64: string) => {
    try {
      await api.patch('/auth/profile/', { avatar: base64 })
      updateUser({ avatar: base64 })
      toast({ title: 'Photo mise à jour', description: 'Votre photo de profil a été modifiée.', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la photo', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/profile/', formData)
      updateUser(formData)
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été sauvegardées.', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Avatar Section */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
                {user.avatar ? (
                  <img src={`data:image/jpeg;base64,${user.avatar}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center cursor-pointer hover:bg-teal-800 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.username}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
                {user.is_verified && <Badge variant="success">Vérifié</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />Informations personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Nom d'utilisateur</Label>
              <Input value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />Téléphone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+212 6XX XXX XXX" type="tel" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />Email</Label>
            <Input value={user.email} disabled className="bg-slate-50 text-slate-500" />
            <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />Bio</Label>
            <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Parlez un peu de vous..." rows={3} />
          </div>

          <Separator />

          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />Localisation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />Ville</Label>
              <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Casablanca" />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />Région</Label>
              <Input value={formData.region} onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))} placeholder="Casablanca-Settat" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />Adresse</Label>
            <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Rue, quartier..." />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Membre depuis le {new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sauvegarde...</> : <><Save className="w-4 h-4 mr-2" />Sauvegarder</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Cropper */}
      <AvatarCropper
        imageSrc={cropImageSrc}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}
