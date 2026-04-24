import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ToggleLeft, Plus, Edit, Trash2, GripVertical, Save, Loader2, Eye, X } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { toast, toastPromise } from '@/hooks/useToast'
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

function SortableField({ field, onEdit, onDelete, onToggle }: { field: ApplicationField; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(!field.is_active && "opacity-50")}>
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
              <GripVertical className="w-4 h-4 text-slate-300" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{field.label}</p>
                <Badge variant="outline" className="text-[10px]">{fieldTypeLabels[field.field_type] || field.field_type}</Badge>
                {field.is_required && <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>}
              </div>
              {field.placeholder && <p className="text-xs text-slate-400 mt-0.5">Placeholder: {field.placeholder}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={field.is_active} onCheckedChange={onToggle} />
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 cursor-pointer" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FieldPreview({ field }: { field: ApplicationField }) {
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)

  const label = field.is_required ? `${field.label} *` : field.label

  switch (field.field_type) {
    case 'text':
      return (
        <div>
          <Label className="mb-1.5 block">{label}</Label>
          <Input 
            placeholder={field.placeholder || ''} 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            className="w-full"
          />
          {field.help_text && <p className="text-xs text-slate-500 mt-1">{field.help_text}</p>}
        </div>
      )
    case 'number':
      return (
        <div>
          <Label className="mb-1.5 block">{label}</Label>
          <Input 
            type="number"
            placeholder={field.placeholder || ''} 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            className="w-full"
          />
          {field.help_text && <p className="text-xs text-slate-500 mt-1">{field.help_text}</p>}
        </div>
      )
    case 'textarea':
      return (
        <div>
          <Label className="mb-1.5 block">{label}</Label>
          <textarea 
            placeholder={field.placeholder || ''} 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
          {field.help_text && <p className="text-xs text-slate-500 mt-1">{field.help_text}</p>}
        </div>
      )
    case 'select':
      return (
        <div>
          <Label className="mb-1.5 block">{label}</Label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.choices || []).map((choice) => (
                <SelectItem key={choice} value={choice}>{choice}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.help_text && <p className="text-xs text-slate-500 mt-1">{field.help_text}</p>}
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id={field.id}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">{label}</Label>
        </div>
      )
    default:
      return (
        <div>
          <Label className="mb-1.5 block">{label}</Label>
          <Input placeholder={field.placeholder || ''} className="w-full" />
        </div>
      )
  }
}

export default function ApplicationFields() {
  const { user } = useAuth()
  const [fields, setFields] = useState<ApplicationField[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ApplicationField | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [form, setForm] = useState({
    label: '',
    field_type: 'text' as string,
    placeholder: '',
    help_text: '',
    choices: [] as string[],
    is_required: true,
    is_active: true,
  })

  const [newOption, setNewOption] = useState('')

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
    setForm({ label: '', field_type: 'text', placeholder: '', help_text: '', choices: [], is_required: true, is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (field: ApplicationField) => {
    setEditingField(field)
    setForm({
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder,
      help_text: field.help_text,
      choices: field.choices || [],
      is_required: field.is_required,
      is_active: field.is_active,
    })
    setDialogOpen(true)
  }

  const addOption = () => {
    if (!newOption.trim()) return
    if (form.choices.includes(newOption.trim())) {
      toast({ title: 'Cette option existe déjà', variant: 'destructive' })
      return
    }
    setForm(prev => ({ ...prev, choices: [...prev.choices, newOption.trim()] }))
    setNewOption('')
  }

  const removeOption = (option: string) => {
    setForm(prev => ({ ...prev, choices: prev.choices.filter(c => c !== option) }))
  }

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      toast({ title: 'Le label est obligatoire', variant: 'destructive' })
      return
    }
    if (form.field_type === 'select' && form.choices.length === 0) {
      toast({ title: 'Ajoutez au moins une option', variant: 'destructive' })
      return
    }

    const payload = {
      ...form,
      choices: form.field_type === 'select' ? form.choices : [],
    }

    try {
      await toastPromise(
        async () => {
          if (editingField) {
            await api.put(`/auth/application-fields/${editingField.id}/`, payload)
          } else {
            await api.post('/auth/application-fields/', payload)
          }
        },
        {
          loading: editingField ? 'Mise à jour...' : 'Création...',
          success: () => {
            setDialogOpen(false)
            fetchFields()
            return editingField 
              ? `"${form.label}" a été mis à jour.` 
              : `"${form.label}" a été créé.`
          },
          error: () => 'Impossible de sauvegarder',
        }
      )
    } catch {
      // Error handled by toastPromise
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await toastPromise(
        async () => {
          await api.delete(`/auth/application-fields/${id}/`)
          setFields(prev => prev.filter(f => f.id !== id))
        },
        {
          loading: 'Suppression...',
          success: () => {
            setDeleteConfirm(null)
            return 'Champ supprimé'
          },
          error: () => 'Impossible de supprimer',
        }
      )
    } catch {
      // Error handled by toastPromise
    }
  }

  const handleToggleActive = async (field: ApplicationField) => {
    try {
      await toastPromise(
        async () => {
          await api.patch(`/auth/application-fields/${field.id}/`, { is_active: !field.is_active })
        },
        {
          loading: 'Mise à jour...',
          success: () => {
            setFields(prev => prev.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f))
            return field.is_active ? 'Champ désactivé' : 'Champ activé'
          },
          error: () => 'Impossible de mettre à jour',
        }
      )
    } catch {
      // Error handled by toastPromise
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)
    const newOrder = arrayMove(fields, oldIndex, newIndex)
    setFields(newOrder)

    const order = newOrder.map(f => f.id)

    try {
      await toastPromise(
        async () => {
          await api.patch('/auth/application-fields/reorder/', { order })
        },
        {
          loading: 'Mise à jour...',
          success: () => "Ordre mis à jour",
          error: () => "Impossible de sauvegarder l'ordre",
        }
      )
    } catch {
      fetchFields()
    }
  }

  const activeFields = fields.filter(f => f.is_active)

  if (user?.role !== 'admin') {
    return <div className="text-center py-12"><p className="text-slate-500">Accès réservé aux administrateurs</p></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 custom-scrollbar">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="cursor-pointer">
            <Eye className="w-4 h-4 mr-2" />Aperçu
          </Button>
          <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />Ajouter
          </Button>
        </div>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 custom-scrollbar">
              {fields.map((field, i) => (
                <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <SortableField 
                    field={field} 
                    onEdit={() => openEdit(field)} 
                    onDelete={() => setDeleteConfirm(field.id)} 
                    onToggle={() => handleToggleActive(field)} 
                  />
                </motion.div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              <Select value={form.field_type} onValueChange={(v) => setForm(prev => ({ ...prev, field_type: v, choices: v === 'select' ? prev.choices : [] }))}>
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
              <Input value={form.help_text} onChange={(e) => setForm(prev => ({ ...prev, help_text: e.target.value }))} placeholder="Description..." />
            </div>

            {/* Options pour select */}
            {form.field_type === 'select' && (
              <div>
                <Label className="mb-1.5 block">Options</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    value={newOption} 
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    placeholder="Ajouter une option..." 
                    className="flex-1"
                  />
                  <Button type="button" onClick={addOption} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 border border-slate-200 rounded-lg">
                  {form.choices.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucune option ajoutée</p>
                  ) : (
                    form.choices.map((choice) => (
                      <Badge key={choice} variant="secondary" className="pl-2 pr-1 py-1">
                        {choice}
                        <button 
                          type="button"
                          onClick={() => removeOption(choice)} 
                          className="ml-1 p-0.5 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_required} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_required: v }))} />
                <Label>Obligatoire</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} />
                <Label>Actif</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">Annuler</Button>
            <Button onClick={handleSubmit} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              <Save className="w-4 h-4 mr-2" />Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Aperçu du formulaire</DialogTitle>
            <DialogDescription>Voici comment le formulaire de demande d'agent sera affiché</DialogDescription>
          </DialogHeader>
          {activeFields.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Aucun champ actif configuré</div>
          ) : (
            <div className="space-y-4 py-4">
              {activeFields.map(field => (
                <FieldPreview key={field.id} field={field} />
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce champ ? Cette action est irréversible.</DialogDescription>
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