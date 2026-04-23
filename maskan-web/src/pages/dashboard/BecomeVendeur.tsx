import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import type { ApplicationField, VendeurApplication } from '@/types'

export default function BecomeVendeur() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState<ApplicationField[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingApp, setExistingApp] = useState<VendeurApplication | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fieldsRes, appRes] = await Promise.all([
          api.get('/auth/application-fields/active/'),
          api.get('/auth/vendeur-application/'),
        ])
        setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : [])
        if (appRes.data.status && appRes.data.status !== 'none') {
          setExistingApp(appRes.data)
        }
      } catch {
        setFields([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const responseList = Object.entries(responses)
        .filter(([_, value]) => value.trim())
        .map(([field_id, value]) => ({ field_id, value }))

      await api.post('/auth/vendeur-application/', { responses: responseList })
      toast({ title: 'Demande envoyée', description: 'Votre demande sera examinée par un administrateur.', variant: 'success' })
      await refreshUser()
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Erreur lors de l\'envoi'
        : 'Erreur lors de l\'envoi'
      toast({ title: 'Erreur', description: String(msg), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.role === 'vendeur') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Vous êtes déjà vendeur</h2>
        <p className="text-slate-500">Votre compte est enregistré en tant que vendeur immobilier.</p>
      </div>
    )
  }

  if (existingApp?.status === 'pending') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Loader2 className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Demande en cours</h2>
        <p className="text-slate-500 mb-4">Votre demande est en cours d'examen par un administrateur.</p>
        <Badge variant="warning">En attente</Badge>
      </div>
    )
  }

  if (existingApp?.status === 'rejected') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Demande refusée</h2>
        <p className="text-slate-500 mb-2">{existingApp.admin_notes || 'Votre demande a été refusée.'}</p>
        <p className="text-sm text-slate-400 mb-6">Vous pouvez soumettre une nouvelle demande.</p>
        <Button onClick={() => setExistingApp(null)} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
          Soumettre à nouveau
        </Button>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-700" /></div>
  }

  const renderField = (field: ApplicationField) => {
    const commonProps = {
      value: responses[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setResponses(prev => ({ ...prev, [field.id]: e.target.value })),
    }

    switch (field.field_type) {
      case 'text':
        return <Input placeholder={field.placeholder} required={field.is_required} {...commonProps} />
      case 'number':
        return <Input type="number" placeholder={field.placeholder} required={field.is_required} {...commonProps} />
      case 'textarea':
        return <Textarea placeholder={field.placeholder} required={field.is_required} rows={4} {...commonProps} />
      case 'select':
        return (
          <Select value={responses[field.id] || ''} onValueChange={(v) => setResponses(prev => ({ ...prev, [field.id]: v }))}>
            <SelectTrigger><SelectValue placeholder={field.placeholder || 'Sélectionner...'} /></SelectTrigger>
            <SelectContent>
              {(field.choices || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )
      case 'checkbox':
        return (
          <button
            type="button"
            onClick={() => setResponses(prev => ({ ...prev, [field.id]: prev[field.id] === 'true' ? '' : 'true' }))}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${responses[field.id] === 'true' ? 'bg-teal-700 border-teal-700' : 'border-slate-300'}`}
          >
            {responses[field.id] === 'true' && <Check className="w-4 h-4 text-white" />}
          </button>
        )
      default:
        return <Input placeholder={field.placeholder} {...commonProps} />
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          Devenir vendeur
        </h1>
        <p className="text-sm text-slate-500 mt-1">Remplissez le formulaire ci-dessous pour postuler en tant que vendeur</p>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-6 space-y-5">
          {fields.map((field) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <label className="block text-sm font-medium text-slate-700">
                {field.label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field.help_text && <p className="text-xs text-slate-400">{field.help_text}</p>}
            </motion.div>
          ))}

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</> : <><UserPlus className="w-4 h-4 mr-2" /> Soumettre la demande</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}