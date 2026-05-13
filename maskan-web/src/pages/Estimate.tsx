import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, ArrowRight, RotateCcw, Building, MapPin, Home, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import api from '@/lib/api'
import type { AxiosError } from 'axios'
import type { Property, PaginatedResponse } from '@/types'
import PropertyCard from '@/components/PropertyCard'

const PROPERTY_TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'riad', label: 'Riad' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'studio', label: 'Studio' },
]

const TYPE_MAP: Record<string, string> = {
  appartement: 'apartment',
  maison: 'house',
  villa: 'villa',
  riad: 'riad',
  duplex: 'apartment',
  studio: 'studio',
}

interface EstimateResult {
  prix_m2_moyen: number
  fourchette_basse: number
  fourchette_haute: number
  devise: string
  modele: string
  source: string
  annee_reference: string
  niveau_confiance: string
  nb_annonces: number | null
  disclaimer: string
}

async function detectLocation(): Promise<{ ville: string; quartier: string } | null> {
  if (!navigator.geolocation) return null
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    )
    const { latitude, longitude } = pos.coords
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=fr`,
    )
    const data = await res.json()
    const addr = data.address || {}
    const ville = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
    const quartier = addr.suburb || addr.neighbourhood || addr.road || addr.hamlet || ''
    if (!ville) return null
    return { ville, quartier }
  } catch {
    return null
  }
}

export default function Estimate() {
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [typeDeBien, setTypeDeBien] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState('')
  const [relatedProps, setRelatedProps] = useState<Property[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  const isValid = ville.trim() && quartier.trim() && typeDeBien

  const handleDetectLocation = async () => {
    setLocating(true)
    const loc = await detectLocation()
    if (loc) {
      setVille(loc.ville)
      if (loc.quartier) setQuartier(loc.quartier)
      toast({
        title: 'Position détectée',
        description: loc.quartier
          ? `${loc.ville} — ${loc.quartier}`
          : loc.ville,
      })
    } else {
      toast({
        title: 'Géolocalisation impossible',
        description: 'Vérifie les permissions ou entre la ville manuellement.',
        variant: 'destructive',
      })
    }
    setLocating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError('')
    setResult(null)
    setRelatedProps([])

    try {
      const res = await api.post('/properties/estimate/', {
        ville: ville.trim(),
        quartier: quartier.trim(),
        type_de_bien: typeDeBien,
      })
      setResult(res.data)

      const apiType = TYPE_MAP[typeDeBien]
      if (apiType) {
        setLoadingRelated(true)
        try {
          const prixMoyen = res.data.prix_m2_moyen
          const params: Record<string, string | number> = {
            property_type: apiType,
            page_size: 6,
            ordering: '-created_at',
          }
          if (ville.trim()) params.city = ville.trim()
          if (prixMoyen) {
            params.price_min = Math.round(prixMoyen * 40)
            params.price_max = Math.round(prixMoyen * 200)
          }
          const propsRes = await api.get<PaginatedResponse<Property>>('/properties/', { params })
          setRelatedProps(propsRes.data.results || [])
        } catch {
          // non-blocking
        } finally {
          setLoadingRelated(false)
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>
      const message =
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        'Erreur inattendue.'
      setError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setRelatedProps([])
    setError('')
    setVille('')
    setQuartier('')
    setTypeDeBien('')
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('fr-FR').format(val)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-3">
            Estimez votre bien
          </h1>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Recevez une estimation IA du prix au m² selon la ville, le quartier et le type de bien
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-0 shadow-card max-w-lg mx-auto">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        placeholder="Ville"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className="pl-10 pr-28"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={locating}
                        title="Utiliser ma position actuelle"
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 active:bg-teal-300 disabled:opacity-50 rounded-lg transition-all cursor-pointer z-10 border border-teal-200 hover:border-teal-300 shadow-sm"
                      >
                        {locating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                        {locating ? '...' : 'Auto'}
                      </button>
                    </div>

                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Quartier"
                        value={quartier}
                        onChange={(e) => setQuartier(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                      <Select value={typeDeBien} onValueChange={setTypeDeBien}>
                        <SelectTrigger className="pl-10 cursor-pointer">
                          <SelectValue placeholder="Type de bien" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={!isValid || loading}
                      className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Estimation en cours...
                        </span>
                      ) : (
                        <>
                          Estimer maintenant
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg mx-auto"
            >
              <Card className="border-0 shadow-card overflow-hidden">
                <div className="bg-teal-700 px-6 py-4 text-white text-left">
                  <p className="text-sm opacity-80">
                    {ville} — {quartier}
                  </p>
                  <p className="text-xs opacity-60 capitalize">{typeDeBien}</p>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Prix moyen au m²</p>
                    <p className="text-5xl font-bold text-teal-700">
                      {formatPrice(result.prix_m2_moyen)}
                      <span className="text-2xl font-normal text-slate-400 ml-1">
                        {result.devise}
                      </span>
                    </p>
                    <p className="text-sm text-slate-400 mt-1">/ m²</p>
                  </div>

                  <div className="bg-teal-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-2">Fourchette de prix</p>
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs text-slate-400">Min</p>
                        <p className="text-lg font-semibold text-slate-700">
                          {formatPrice(result.fourchette_basse)} {result.devise}
                        </p>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="h-2 rounded-full bg-teal-200 relative overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{
                              marginLeft: '10%',
                              width: '80%',
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Max</p>
                        <p className="text-lg font-semibold text-slate-700">
                          {formatPrice(result.fourchette_haute)} {result.devise}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">Source</span>
                      <span className="text-xs font-medium text-slate-700 text-right">
                        {result.source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">Année de référence</span>
                      <span className="text-xs font-medium text-slate-700">{result.annee_reference}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">Niveau de confiance</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        result.niveau_confiance?.toLowerCase().includes('élevé')
                          ? 'bg-green-100 text-green-700'
                          : result.niveau_confiance?.toLowerCase().includes('moyen')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {result.niveau_confiance}
                      </span>
                    </div>
                    {result.nb_annonces != null && (
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-slate-500">Annonces analysées</span>
                        <span className="text-xs font-medium text-slate-700">{result.nb_annonces}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                      {result.disclaimer}
                    </p>
                  </div>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nouvelle estimation
                  </Button>
                </CardContent>
              </Card>

              {relatedProps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 text-left"
                >
                  <h2 className="text-xl font-bold text-teal-900 mb-6 text-center">
                    Biens similaires à {ville}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {relatedProps.slice(0, 6).map((p, i) => (
                      <PropertyCard key={p.id} property={p} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
              {loadingRelated && (
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recherche de biens similaires...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && !result && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm mt-4"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  )
}
