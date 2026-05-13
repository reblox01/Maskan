import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import {
  BedDouble, Bath, Maximize, MapPin, Phone, MessageCircle,
  Mail, ChevronLeft, ChevronRight, Heart, Share2, Home, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import PropertyMap from '@/components/PropertyMap'
import { usePropertyDetail } from '@/hooks/useProperties'
import { cn, formatPrice, formatMonthlyPayment } from '@/lib/utils'
import { toggleFavorite, createVisitRequest, getBookedDates } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const typeLabels: Record<string, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  house: 'Maison',
  land: 'Terrain',
  commercial: 'Local commercial',
  office: 'Bureau',
}

const placeholderImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
]

const timeSlots = [
  { value: '09:00', label: '09:00 - 10:00' },
  { value: '10:00', label: '10:00 - 11:00' },
  { value: '11:00', label: '11:00 - 12:00' },
  { value: '14:00', label: '14:00 - 15:00' },
  { value: '15:00', label: '15:00 - 16:00' },
  { value: '16:00', label: '16:00 - 17:00' },
  { value: '17:00', label: '17:00 - 18:00' },
  { value: '18:00', label: '18:00 - 19:00' },
]

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { property, loading, error } = usePropertyDetail(id || '')
  const { user } = useAuth()
  const [currentImage, setCurrentImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([])
  const heartRef = useRef<HTMLButtonElement>(null)

  useGSAP(() => {
    if (!heartRef.current) return
    if (isFavorited) {
      gsap.fromTo(heartRef.current, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' })
    }
  }, [isFavorited])

  const handleToggleFavorite = async () => {
    if (!id) return
    try {
      const res = await toggleFavorite(id)
      setIsFavorited(res.favorited)
    } catch {
      setIsFavorited(false)
    }
  }

  const fetchBookedSlots = async () => {
    if (!id) return
    try {
      const data = await getBookedDates(id)
      setBookedSlots(data)
    } catch {
      // ignore
    }
  }

  const openVisitDialog = () => {
    if (!user) { navigate('/login'); return }
    setVisitDialogOpen(true)
    setSelectedDate(undefined)
    setSelectedTime('')
    setVisitNotes('')
    fetchBookedSlots()
  }

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookedSlots.some(s => s.date === dateStr && s.time === time)
  }

  const handleRequestVisit = async () => {
    if (!id || !selectedDate || !selectedTime) return
    setSubmitting(true)
    try {
      const scheduledDate = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00Z`
      await createVisitRequest(id, { scheduled_date: scheduledDate, notes: visitNotes })
      toast.success('Demande de visite envoyée avec succès')
      setVisitDialogOpen(false)
      setSelectedDate(undefined)
      setSelectedTime('')
      setVisitNotes('')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors de l\'envoi de la demande'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="aspect-[16/9] bg-slate-100 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-slate-100 rounded animate-pulse w-48" />
            <div className="h-5 bg-slate-100 rounded animate-pulse w-32" />
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bien non trouvé</h2>
        <p className="text-slate-500 mb-6">Ce bien n'existe pas ou a été supprimé.</p>
        <Link to="/properties">
          <Button className="cursor-pointer">Retour aux biens</Button>
        </Link>
      </div>
    )
  }

  const images = property.images?.length
    ? property.images.map((img) => img.image_url)
    : placeholderImages

  const typeLabel = typeLabels[property.property_type] || property.property_type
  const isOwner = user?.id === property.agent?.id

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-teal-700 cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-teal-700 cursor-pointer">Achat</Link>
          <span>/</span>
          <Link to={`/properties?region=${property.region}`} className="hover:text-teal-700 cursor-pointer">
            {property.region}
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate">{property.city}</span>
        </nav>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white cursor-pointer transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all cursor-pointer",
                      i === currentImage ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                    )}
                  />
                ))}
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "w-16 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                      i === currentImage ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              ref={heartRef}
              onClick={handleToggleFavorite}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all",
                isFavorited ? "bg-red-500 text-white" : "bg-white/80 text-slate-600 hover:bg-white"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-slate-600 hover:bg-white cursor-pointer transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-teal-900">
                  {property.title}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{typeLabel}</Badge>
                  {property.status === 'available' && <Badge variant="success">Disponible</Badge>}
                  {property.status === 'sold' && <Badge variant="destructive">Vendu</Badge>}
                  {property.status === 'rented' && <Badge variant="secondary">Loué</Badge>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl md:text-3xl font-bold text-teal-900">
                  {formatPrice(property.price)}
                </p>
                <p className="text-sm text-slate-500">
                  À partir de {formatMonthlyPayment(property.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-600 mb-6">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{property.address || property.city}, {property.region}</span>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-slate-200 mb-6">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-lg font-semibold text-teal-900">{property.bedrooms}</p>
                    <p className="text-xs text-slate-500">Chambres</p>
                  </div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-lg font-semibold text-teal-900">{property.bathrooms}</p>
                    <p className="text-xs text-slate-500">Salles de bain</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Maximize className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-lg font-semibold text-teal-900">{property.area_sqm}</p>
                  <p className="text-xs text-slate-500">m²</p>
                </div>
              </div>
            </div>

            {property.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-teal-900 mb-3">Description</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {property.latitude && property.longitude && (
              <div className="relative z-0">
                <h2 className="text-lg font-semibold text-teal-900 mb-3">Localisation</h2>
                <div className="relative z-0 rounded-xl overflow-hidden">
                  <PropertyMap
                    pins={[{
                      id: property.id,
                      title: property.title,
                      price: property.price,
                      currency: property.currency,
                      property_type: property.property_type,
                      city: property.city,
                      latitude: Number(property.latitude),
                      longitude: Number(property.longitude),
                      status: property.status,
                    }]}
                    center={[Number(property.latitude), Number(property.longitude)]}
                    zoom={15}
                    height="300px"
                    className="max-h-[300px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Agent Card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white border border-slate-200 rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold">
                  {property.agent?.username?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-teal-900">{property.agent?.username || 'Agent'}</p>
                  <p className="text-xs text-slate-500">Conseiller immobilier</p>
                </div>
              </div>

              <div className="space-y-3">
                {property.agent?.phone && (
                  <Button className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer">
                    <Phone className="w-4 h-4 mr-2" />
                    {property.agent.phone}
                  </Button>
                )}
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <a
                    href={`https://wa.me/${property.agent?.phone?.replace(/\D/g, '') || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <a href={`mailto:${property.agent?.email || ''}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer un email
                  </a>
                </Button>

                {!isOwner && property.status !== 'sold' && property.status !== 'rented' && (
                  <Button
                    className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer"
                    onClick={openVisitDialog}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Demander une visite
                  </Button>
                )}
              </div>

              <p className="text-xs text-slate-400 text-center mt-4">
                Réponse généralement en moins de 24h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Request Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Demander une visite</DialogTitle>
            <DialogDescription>
              Choisissez une date et un créneau horaire pour visiter ce bien.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center overflow-x-auto px-2">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={{ before: today }}
                locale={fr}
                className="!m-0 scale-[0.85] sm:scale-100 origin-top"
              />
            </div>
            {selectedDate && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Créneau horaire
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {timeSlots.map((slot) => {
                    const booked = selectedDate ? isSlotBooked(selectedDate, slot.value) : false
                    return (
                      <button
                        key={slot.value}
                        onClick={() => !booked && setSelectedTime(slot.value)}
                        disabled={booked}
                        className={cn(
                          "px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all whitespace-nowrap",
                          booked
                            ? "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                            : selectedTime === slot.value
                              ? "bg-teal-700 text-white border-teal-700 cursor-pointer"
                              : "bg-white text-slate-700 border-slate-200 hover:border-teal-300 cursor-pointer"
                        )}
                      >
                        {booked ? `${slot.label} · Réservé` : slot.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <textarea
              placeholder="Notes supplémentaires (optionnel)"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
            />
            <Button
              className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer"
              disabled={!selectedDate || !selectedTime || submitting}
              onClick={handleRequestVisit}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
