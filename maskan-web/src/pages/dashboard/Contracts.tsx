import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { FileText, Check, ExternalLink, MapPin, Building2, User, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { getContracts, signContract, createContract } from '@/lib/api'
import api from '@/lib/api'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import type { Contract } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' | 'default' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  signed_by_vendeur: { label: 'Signé par le vendeur', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

function SkeletonCard() {
  return (
    <Card className="border-0 shadow-card"><CardContent className="p-4 space-y-3">
      <Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-32" /><Skeleton className="h-8 w-full rounded-lg" />
    </CardContent></Card>
  )
}

export default function Contracts() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedPropertyPrice, setSelectedPropertyPrice] = useState<number>(0)
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [contractPrice, setContractPrice] = useState('')
  const [contractNotes, setContractNotes] = useState('')
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const isVendeur = user?.role === 'vendeur' || user?.role === 'admin'

  useEffect(() => {
    fetchContracts()
    if (isVendeur) {
      fetchMyProperties()
      fetchBuyers()
    }
  }, [])

  useGSAP(() => {
    const cards = document.querySelectorAll('.contract-card')
    if (!cards.length) return
    gsap.fromTo(cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
    )
  }, [contracts.length])

  const fetchContracts = async () => {
    try {
      const data = await getContracts()
      setContracts(data)
    } catch {
      toast.error('Erreur lors du chargement des contrats')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyProperties = async () => {
    try {
      const res = await api.get('/properties/my-properties/')
      setMyProperties(res.data.results || res.data || [])
    } catch { /* ignore */ }
  }

  const fetchBuyers = async () => {
    try {
      const res = await api.get('/properties/my-visit-requests/')
      setBuyers(res.data || [])
    } catch { /* ignore */ }
  }

  const handleSign = async (id: string) => {
    try {
      await signContract(id)
      toast.success('Contrat signé avec succès')
      fetchContracts()
    } catch {
      toast.error('Erreur lors de la signature')
    }
  }

  const handleCreate = async () => {
    if (!selectedProperty || !selectedBuyer || !contractPrice) return
    setCreating(true)
    try {
      await createContract({
        property: selectedProperty,
        acquereur: selectedBuyer,
        agreed_price: parseFloat(contractPrice),
        notes: contractNotes,
        contract_type: 'sale',
      })
      toast.success('Contrat créé avec succès')
      setCreateOpen(false)
      setSelectedProperty('')
      setSelectedBuyer('')
      setContractPrice('')
      setContractNotes('')
      fetchContracts()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const statusLabel = (s: string) => statusConfig[s]?.label || s
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contrats</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '...' : `${contracts.length} contrat${contracts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isVendeur && (
          <Button className="bg-teal-700 hover:bg-teal-800 cursor-pointer" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Créer un contrat
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Aucun contrat</h3>
            <p className="text-sm text-slate-500">
              {isVendeur
                ? 'Créez un contrat après une visite confirmée.'
                : 'Les contrats apparaîtront ici après achat.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((contract) => {
            const isExpanded = expandedId === contract.id
            return (
              <div key={contract.id} className="contract-card">
                <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/properties/${contract.property}`}
                          className="text-sm font-semibold text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1"
                        >
                          {contract.property_title || 'Propriété'}
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40" />
                        </Link>
                        {contract.property_address && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {contract.property_address}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusConfig[contract.status]?.variant || 'secondary'}>
                        {statusLabel(contract.status)}
                      </Badge>
                    </div>

                    <p className="text-lg font-bold text-teal-700 mb-2">
                      {formatPrice(contract.agreed_price)}
                    </p>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <User className="w-3.5 h-3.5" />
                        <span>
                          {isVendeur
                            ? `Acquéreur: ${contract.acquereur_name || 'N/A'}`
                            : `Vendeur: ${contract.vendeur_name || 'N/A'}`}
                        </span>
                        <span className="text-teal-600 ml-auto text-[10px]">
                          {isExpanded ? 'Réduire' : 'Détails'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 pt-3 mt-1 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{contract.contract_type === 'sale' ? 'Vente' : 'Location'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Créé le {formatDate(contract.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Vendeur: {contract.vendeur_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Acquéreur: {contract.acquereur_name || 'N/A'}</span>
                        </div>
                        {contract.notes && (
                          <div className="bg-slate-50 rounded-lg p-2.5 italic text-slate-500">"{contract.notes}"</div>
                        )}
                        <Link to={`/properties/${contract.property}`}>
                          <Button size="sm" variant="outline" className="w-full cursor-pointer">
                            <Building2 className="w-3.5 h-3.5 mr-1" /> Voir le bien
                          </Button>
                        </Link>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {contract.status === 'signed_by_vendeur' && !isVendeur && (
                        <Button size="sm" className="flex-1 bg-teal-700 hover:bg-teal-800 cursor-pointer" onClick={() => handleSign(contract.id)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Signer le contrat
                        </Button>
                      )}
                      {isVendeur && contract.status === 'draft' && (
                        <Button size="sm" className="flex-1 bg-teal-700 hover:bg-teal-800 cursor-pointer" onClick={() => handleSign(contract.id)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Signer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Contract Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un contrat de vente</DialogTitle>
            <DialogDescription>Sélectionnez le bien et l'acquéreur pour créer le contrat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Bien</label>
              <Select
                value={selectedProperty}
                onValueChange={(val) => {
                  setSelectedProperty(val)
                  const prop = myProperties.find((p: any) => p.id === val)
                  if (prop) setSelectedPropertyPrice(prop.price)
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un bien" /></SelectTrigger>
                <SelectContent>
                  {myProperties.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Acquéreur</label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger><SelectValue placeholder="Choisir un acquéreur" /></SelectTrigger>
                <SelectContent>
                  {buyers
                    .filter((v: any) => !selectedProperty || v.related_property?.id === selectedProperty)
                    .map((v: any) => {
                      const c = v.client
                      return c ? (
                        <SelectItem key={c.id} value={c.id}>
                          {c.username} {c.phone ? `· ${c.phone}` : ''}
                        </SelectItem>
                      ) : null
                    })}
                  {selectedProperty && buyers.filter((v: any) => v.related_property?.id === selectedProperty).length === 0 && (
                    <div className="px-2 py-4 text-xs text-slate-400 text-center">Aucune demande pour ce bien</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Prix convenu (MAD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={contractPrice}
                  onChange={e => setContractPrice(e.target.value)}
                  placeholder="Ex: 800000"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  min={0}
                />
                {selectedPropertyPrice > 0 && (
                  <button
                    type="button"
                    onClick={() => setContractPrice(String(selectedPropertyPrice))}
                    className="shrink-0 px-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                    title="Utiliser le prix du bien"
                  >
                    {formatPrice(selectedPropertyPrice)}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes (optionnel)</label>
              <textarea
                value={contractNotes}
                onChange={e => setContractNotes(e.target.value)}
                placeholder="Conditions, détails..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
              />
            </div>
            <Button
              className="w-full bg-teal-700 hover:bg-teal-800 cursor-pointer"
              disabled={!selectedProperty || !selectedBuyer || !contractPrice || creating}
              onClick={handleCreate}
            >
              {creating ? 'Création...' : 'Créer le contrat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
