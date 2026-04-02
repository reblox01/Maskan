import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ToggleLeft, Plus, Edit, Trash2, GripVertical, Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApplicationField } from '@/types'

const fieldTypeLabels: Record<string, string> = {
  text: 'Texte',
  number: 'Nombre',
  textarea: 'Zone de texte',
  select: 'Liste déroulante',
  checkbox: 'Case à cocher',
  file: 'Fichier',
}

export default function ApplicationFields() {
  const { user } = useAuth()
  const [fields, setFields] = useState<ApplicationField[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ApplicationField | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: '',
    field_type: 'text' as string,
    placeholder: '',
    help_text: '',
    choices: '',
    is_required: true,
    is_active: true,
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchFields()
  }, [user])

  const fetchFields = () => {
    setLoading(true)
    api.get('/auth/application-fields/')
      .then(res => setFields(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFields([]))
      .finally(() => setLoading(false))
  }

  const openCreate = () => {
    setEditingField(null)
    setForm({ label: '', field_type: 'text', placeholder: '', help_text: '', choices: '', is_required: true, is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (field: ApplicationField) => {
    setEditingField(field)
    setForm({
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder,
      help_text: field.help_text,
      choices: (field.choices || []).join(', '),
      is_required: field.is_required,
      is_active: field.is_active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      toast({ title: 'Erreur', description: 'Le label est obligatoire', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        choices: form.field_type === 'select' ? form.choices.split(',').map(c => c.trim()).filter(Boolean) : [],
      }
      if (editingField) {
        await api.put(`/auth/application-fields/${editingField.id}/`, payload)
        toast({ title: 'Champ modifié', description: `"${form.label}" a été mis à jour.`, variant: 'success' })
      } else {
        await api.post('/auth/application-fields/', payload)
        toast({ title: 'Champ ajouté', description: `"${form.label}" a été créé.`, variant: 'success' })
      }
      setDialogOpen(false)
      fetchFields()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/auth/application-fields/${id}/`)
      setFields(prev => prev.filter(f => f.id !== id))
      setDeleteConfirm(null)
      toast({ title: 'Champ supprimé', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (field: ApplicationField) => {
    try {
      await api.patch(`/auth/application-fields/${field.id}/`, { is_active: !field.is_active })
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f))
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-12"><p className="text-slate-500">Accès réservé aux administrateurs</p></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ToggleLeft className="w-5 h-5" />
            </div>
            Configuration des champs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les champs du formulaire de demande d'agent</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>
      ) : fields.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <ToggleLeft className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucun champ configuré</h3>
            <p className="text-sm text-slate-500 mb-4">Ajoutez des champs pour le formulaire de demande d'agent</p>
            <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800 cursor-pointer"><Plus className="w-4 h-4 mr-2" />Ajouter un champ</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field, i) => (
            <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn("border-0 shadow-card transition-opacity", !field.is_active && "opacity-50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{field.label}</p>
                        <Badge variant="outline" className="text-[10px]">{fieldTypeLabels[field.field_type] || field.field_type}</Badge>
                        {field.is_required && <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>}
                      </div>
                      {field.placeholder && <p className="text-xs text-slate-400 mt-0.5">Placeholder: {field.placeholder}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={field.is_active} onCheckedChange={() => handleToggleActive(field)} />
                      <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => openEdit(field)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 cursor-pointer" onClick={() => setDeleteConfirm(field.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Modifier le champ' : 'Ajouter un champ'}</DialogTitle>
            <DialogDescription>Configurez les propriétés du champ du formulaire</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Label du champ</Label>
              <Input value={form.label} onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))} placeholder="Ex: Nom de l'agence" />
            </div>
            <div>
              <Label className="mb-1.5 block">Type de champ</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm(prev => ({ ...prev, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="textarea">Zone de texte</SelectItem>
                  <SelectItem value="select">Liste déroulante</SelectItem>
                  <SelectItem value="checkbox">Case à cocher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Placeholder</Label>
              <Input value={form.placeholder} onChange={(e) => setForm(prev => ({ ...prev, placeholder: e.target.value }))} placeholder="Texte indicatif..." />
            </div>
            <div>
              <Label className="mb-1.5 block">Texte d'aide</Label>
              <Input value={form.help_text} onChange={(e) => setForm(prev => ({ ...prev, help_text: e.target.value }))} placeholder="Description du champ..." />
            </div>
            {form.field_type === 'select' && (
              <div>
                <Label className="mb-1.5 block">Options (séparées par des virgules)</Label>
                <Input value={form.choices} onChange={(e) => setForm(prev => ({ ...prev, choices: e.target.value }))} placeholder="Option A, Option B, Option C" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Obligatoire</Label>
              <Switch checked={form.is_required} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_required: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Sauvegarder</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce champ ?</DialogTitle>
            <DialogDescription>Cette action est irréversible. Toutes les réponses associées seront supprimées.</DialogDescription>
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
