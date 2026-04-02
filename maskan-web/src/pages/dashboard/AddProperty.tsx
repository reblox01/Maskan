import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, MapPin, DollarSign, Ruler, BedDouble, Bath, Image,
  ArrowRight, ArrowLeft, Check, FileText, Map, Home as HomeIcon, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import LocationPicker from '@/components/LocationPicker'
import ImageUploader from '@/components/ImageUploader'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Type & Titre', icon: Building2 },
  { id: 2, title: 'Localisation', icon: MapPin },
  { id: 3, title: 'Détails & Prix', icon: DollarSign },
  { id: 4, title: 'Description', icon: FileText },
  { id: 5, title: 'Photos', icon: Image },
]

const propertyTypes = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'house', label: 'Maison' },
  { value: 'land', label: 'Terrain' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'office', label: 'Bureau' },
]

export default function AddProperty() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    property_type: '',
    description: '',
    price: '',
    area_sqm: '',
    bedrooms: '0',
    bathrooms: '0',
    address: '',
    city: '',
    region: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [images, setImages] = useState<string[]>([])

  const update = (field: string, value: string | number | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    if (step === 1) return form.title.length >= 5 && form.property_type
    if (step === 2) return form.city && form.region
    if (step === 3) return Number(form.price) > 0 && Number(form.area_sqm) > 0
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area_sqm: Number(form.area_sqm),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        latitude: form.latitude ? parseFloat(Number(form.latitude).toFixed(6)) : null,
        longitude: form.longitude ? parseFloat(Number(form.longitude).toFixed(6)) : null,
        is_published: true,
        images: images.map((img, i) => ({ image_data: img, order: i })),
      }
      const res = await api.post('/properties/', payload)
      toast({ title: 'Bien publié', description: 'Votre bien a été ajouté avec succès.', variant: 'success' })
      navigate(`/properties/${res.data.id}`)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: Record<string, string[]> } }
        const data = axiosErr.response?.data
        if (data) {
          const messages = Object.values(data).flat()
          setError(messages.join(' '))
        } else {
          setError('Erreur lors de la création du bien')
        }
      } else {
        setError('Erreur lors de la création du bien')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajouter un bien</h1>
        <p className="text-sm text-slate-500 mt-1">Publiez votre bien immobilier en quelques étapes</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
              step === s.id ? "bg-teal-700 text-white" :
              step > s.id ? "bg-teal-50 text-teal-700" :
              "bg-slate-100 text-slate-400"
            )}>
              {step > s.id ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("flex-1 h-px mx-0.5", step > s.id ? "bg-teal-300" : "bg-slate-200")} />}
          </div>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          {/* Step 1: Type & Title */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <Label className="mb-3 block flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" />Type de bien</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {propertyTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => update('property_type', t.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer text-left",
                        form.property_type === t.value ? "border-teal-700 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Titre du bien</Label>
                <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ex: Appartement F3 avec vue sur mer" maxLength={200} />
                <p className="text-xs text-slate-400 mt-1">{form.title.length}/200 caractères</p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />Ville</Label>
                  <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Casablanca" />
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-2"><Map className="w-4 h-4 text-slate-400" />Région</Label>
                  <Input value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="Casablanca-Settat" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><HomeIcon className="w-4 h-4 text-slate-400" />Adresse complète</Label>
                <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Rue, quartier, numéro..." />
              </div>

              {/* Map Picker */}
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />Position sur la carte</Label>
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLocationChange={(lat, lng) => {
                    update('latitude', lat)
                    update('longitude', lng)
                  }}
                  onLocationDetails={(city, region, address) => {
                    update('city', city)
                    update('region', region)
                    update('address', address)
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Details & Price */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" />Prix (DH)</Label>
                <Input value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1 800 000" type="number" min="0" />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><Ruler className="w-4 h-4 text-slate-400" />Surface (m²)</Label>
                <Input value={form.area_sqm} onChange={(e) => update('area_sqm', e.target.value)} placeholder="120" type="number" min="1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 flex items-center gap-2"><BedDouble className="w-4 h-4 text-slate-400" />Chambres</Label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => update('bedrooms', String(n))} className={cn("w-10 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer", Number(form.bedrooms) === n ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                        {n === 5 ? '5+' : n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-2"><Bath className="w-4 h-4 text-slate-400" />Salles de bain</Label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => update('bathrooms', String(n))} className={cn("w-10 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer", Number(form.bathrooms) === n ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                        {n === 4 ? '4+' : n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <Label className="mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />Description</Label>
                <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Décrivez votre bien en détail..." rows={6} />
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Résumé</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Type:</span><span className="text-slate-900 font-medium">{form.property_type}</span>
                  <span className="text-slate-500">Ville:</span><span className="text-slate-900 font-medium">{form.city}</span>
                  <span className="text-slate-500">Prix:</span><span className="text-teal-700 font-bold">{Number(form.price || 0).toLocaleString('fr-MA')} DH</span>
                  <span className="text-slate-500">Surface:</span><span className="text-slate-900 font-medium">{form.area_sqm} m²</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <Label className="mb-3 flex items-center gap-2"><Image className="w-4 h-4 text-slate-400" />Photos du bien</Label>
                <ImageUploader images={images} onChange={setImages} maxImages={10} maxSizeMB={10} />
              </div>
            </motion.div>
          )}

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1} className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />Précédent
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                Suivant<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-700 hover:bg-teal-800 cursor-pointer">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publication...</> : <><Check className="w-4 h-4 mr-2" />Publier le bien</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
