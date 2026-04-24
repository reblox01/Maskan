import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'

const consultingTypes = [
  { value: 'valuation', label: 'Évaluation Immobilière' },
  { value: 'legal', label: 'Conseil Juridique' },
  { value: 'investment', label: 'Conseil en Investissement' },
  { value: 'management', label: 'Gestion Immobilière' },
  { value: 'other', label: 'Autre' },
]

export default function Consulting() {
  const { user, loading: authLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    consulting_type: '',
    client_notes: '',
    property_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consulting_type) {
      toast({ title: 'Veuillez sélectionner un type de consultation', variant: 'destructive' })
      return
    }
    if (!user) {
      toast({ title: 'Veuillez vous connecter', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await api.post('/properties/consulting-requests/', {
        consulting_type: form.consulting_type,
        client_notes: form.client_notes,
        property_id: form.property_id || null,
      })
      toast({ title: 'Demande envoyée!', description: 'Nous vous contacterons bientôt.', variant: 'success' })
      setForm({ consulting_type: '', client_notes: '', property_id: '' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer la demande', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-3">Consulting Immobilier</h1>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Besoin de conseils experts ? Nos professionnels vous accompagnent dans votre projet immobilier
          </p>
        </motion.div>

        <Card className="border-0 shadow-card max-w-lg mx-auto">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Type de consultation *</Label>
                <Select value={form.consulting_type} onValueChange={(v) => setForm(prev => ({ ...prev, consulting_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                  <SelectContent>
                    {consultingTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block">Description de votre projet</Label>
                <Textarea 
                  placeholder="Décrivez votre projet ou vos besoins..."
                  value={form.client_notes}
                  onChange={(e) => setForm(prev => ({ ...prev, client_notes: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label className="mb-1.5 block">Ville</Label>
                <Input placeholder="Votre ville" />
              </div>

              <div>
                <Label className="mb-1.5 block">Email de contact</Label>
                <Input placeholder="votre@email.com" type="email" />
              </div>

              <Button type="submit" disabled={submitting || authLoading} className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Envoyer ma demande
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { title: 'Évaluation', desc: 'Estimez la valeur de votre bien' },
            { title: 'Juridique', desc: 'Conseil sur les aspects légaux' },
            { title: 'Investissement', desc: 'Conseils pour investir wisely' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <div className="p-4 rounded-xl bg-white/60 backdrop-blur">
                <h3 className="font-semibold text-teal-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}