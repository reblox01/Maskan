import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Check, AlertCircle, Loader2, ArrowLeft, Clock } from 'lucide-react'
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

export default function VendeurSignupPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState<ApplicationField[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingApp, setExistingApp] = useState<VendeurApplication | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) {
      navigate('/register')
      return
    }
    fetchData()
  }, [user])

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    )
  }

  if (user?.role === 'vendeur') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Card className="border-0 shadow-card max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Vous êtes déjà vendeur</h2>
            <p className="text-slate-500 mb-6">Votre compte est enregistré en tant que vendeur immobilier.</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              Aller au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (existingApp?.status === 'pending') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Card className="border-0 shadow-card max-w-lg mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Demande en cours d'examen</h2>
            <p className="text-slate-500 mb-4">
              Votre demande pour devenir vendeur est en cours de vérification par notre équipe.
              Vous recevrez une notification dès qu'elle sera examinée.
            </p>
            <Badge variant="warning" className="text-sm px-4 py-1.5 mb-6">En attente de vérification</Badge>
            <Separator className="my-6" />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="cursor-pointer">
                Aller au tableau de bord
              </Button>
              <Button onClick={() => navigate('/')} variant="ghost" className="cursor-pointer">
                Continuer à naviguer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (existingApp?.status === 'rejected') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Card className="border-0 shadow-card max-w-lg mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Demande refusée</h2>
            <p className="text-slate-500 mb-2">{existingApp.admin_notes || 'Votre demande a été refusée.'}</p>
            <p className="text-sm text-slate-400 mb-6">Vous pouvez soumettre une nouvelle demande avec des informations mises à jour.</p>
            <Separator className="my-6" />
            <Button onClick={() => setExistingApp(null)} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
              Soumettre à nouveau
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            Devenir vendeur
          </h1>
          <p className="text-slate-500 mt-2">
            Pour publier vos biens immobiliers, remplissez le formulaire ci-dessous.
            Votre demande sera examinée par notre équipe.
          </p>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6 space-y-6">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
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

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="cursor-pointer">
                Plus tard
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Soumettre ma demande</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}