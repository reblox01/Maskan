import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, X, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { cn, formatPrice } from '@/lib/utils'
import { useRegions } from '@/hooks/useLocations'
import type { PropertyFilters } from '@/types'

const propertyTypes = [
  { value: '', label: 'Tout' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'house', label: 'Maison' },
  { value: 'land', label: 'Terrain' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'office', label: 'Bureau' },
]

const budgetPresets = [
  { label: '< 500K', min: 0, max: 500000 },
  { label: '500K - 1M', min: 500000, max: 1000000 },
  { label: '1M - 3M', min: 1000000, max: 3000000 },
  { label: '3M - 5M', min: 3000000, max: 5000000 },
  { label: '> 5M', min: 5000000, max: 50000000 },
]

interface SearchFilterProps {
  onSearch?: (filters: PropertyFilters) => void
  className?: string
  compact?: boolean
}

export default function SearchFilter({ onSearch, className, compact = false }: SearchFilterProps) {
  const navigate = useNavigate()
  const regions = useRegions()

  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy')
  const [searchText, setSearchText] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50_000_000])
  const [activePanel, setActivePanel] = useState<'region' | 'type' | 'budget' | null>(null)

  const togglePanel = (panel: 'region' | 'type' | 'budget') => {
    setActivePanel(prev => prev === panel ? null : panel)
  }

  const handleSearch = () => {
    setActivePanel(null)
    const filters: PropertyFilters = {}
    if (searchText) filters.search = searchText
    if (selectedRegion) filters.region = selectedRegion
    if (selectedType) filters.property_type = selectedType
    if (priceRange[0] > 0) filters.price_min = priceRange[0]
    if (priceRange[1] < 50_000_000) filters.price_max = priceRange[1]

    if (onSearch) {
      onSearch(filters)
    } else {
      const params = new URLSearchParams()
      params.set('type', activeTab)
      if (searchText) params.set('search', searchText)
      if (selectedRegion) params.set('region', selectedRegion)
      if (selectedType) params.set('property_type', selectedType)
      if (priceRange[0] > 0) params.set('price_min', String(priceRange[0]))
      if (priceRange[1] < 50_000_000) params.set('price_max', String(priceRange[1]))
      navigate(`/properties?${params.toString()}`)
    }
  }

  const hasFilters = selectedRegion || selectedType || priceRange[0] > 0 || priceRange[1] < 50_000_000

  const clearAll = () => {
    setSelectedRegion('')
    setSelectedType('')
    setPriceRange([0, 50_000_000])
    setSearchText('')
  }

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      {/* Tabs — centered above search bar */}
      <div className="flex items-center justify-center gap-1 mb-3">
        {(['buy', 'rent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
              activeTab === tab
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-500 hover:text-teal-700 hover:bg-slate-100"
            )}
          >
            {tab === 'buy' ? 'Acheter' : 'Louer'}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-search border border-slate-200 overflow-hidden">
        {/* Search row */}
        <div className={cn("flex items-center", compact ? "gap-0.5 p-1.5" : "gap-1 p-2")}>
          <div className="flex-1 min-w-0 px-2">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher une ville, un quartier..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Region */}
          <button
            onClick={() => togglePanel('region')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              activePanel === 'region' ? "bg-teal-50 text-teal-700" : selectedRegion ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span className="max-w-[100px] truncate">{selectedRegion || 'Région'}</span>
            {activePanel === 'region' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* Type */}
          <button
            onClick={() => togglePanel('type')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              activePanel === 'type' ? "bg-teal-50 text-teal-700" : selectedType ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span>{selectedType ? propertyTypes.find(t => t.value === selectedType)?.label : 'Type de bien'}</span>
            {activePanel === 'type' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* Budget */}
          <button
            onClick={() => togglePanel('budget')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              activePanel === 'budget' ? "bg-teal-50 text-teal-700" : (priceRange[0] > 0 || priceRange[1] < 50_000_000) ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span className="hidden sm:inline">
              {priceRange[0] > 0 || priceRange[1] < 50_000_000
                ? `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`
                : 'Budget'}
            </span>
            <span className="sm:hidden">Budget</span>
            {activePanel === 'budget' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Button
            onClick={handleSearch}
            size={compact ? 'sm' : 'default'}
            className="rounded-full bg-teal-700 hover:bg-teal-800 px-4 cursor-pointer ml-1"
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Rechercher</span>
          </Button>
        </div>

        {/* ============ INLINE PANELS ============ */}

        {/* Region Panel */}
        {activePanel === 'region' && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRegion('')}
                className={cn(
                  "px-4 py-2 text-sm rounded-full border-2 transition-colors cursor-pointer",
                  !selectedRegion
                    ? "bg-teal-700 text-white border-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-teal-300"
                )}
              >
                Toutes
              </button>
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full border-2 transition-colors cursor-pointer",
                    selectedRegion === r
                      ? "bg-teal-700 text-white border-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Panel */}
        {activePanel === 'type' && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full border-2 transition-colors cursor-pointer",
                    selectedType === t.value
                      ? "bg-teal-700 text-white border-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Budget Panel */}
        {activePanel === 'budget' && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mb-5">
              {budgetPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPriceRange([preset.min, preset.max])}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full border-2 transition-colors cursor-pointer",
                    priceRange[0] === preset.min && priceRange[1] === preset.max
                      ? "bg-teal-700 text-white border-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Min</span>
                  <span className="text-sm font-bold text-teal-700">{formatPrice(priceRange[0])}</span>
                </div>
                <Slider
                  value={[priceRange[0]]}
                  onValueChange={(v) => setPriceRange([Math.min(v[0], priceRange[1] - 100000), priceRange[1]])}
                  min={0}
                  max={50_000_000}
                  step={100000}
                  className="cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Max</span>
                  <span className="text-sm font-bold text-teal-700">{formatPrice(priceRange[1])}</span>
                </div>
                <Slider
                  value={[priceRange[1]]}
                  onValueChange={(v) => setPriceRange([priceRange[0], Math.max(v[0], priceRange[0] + 100000)])}
                  min={0}
                  max={50_000_000}
                  step={100000}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setPriceRange([0, 50_000_000])}
              >
                Réinitialiser
              </Button>
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 cursor-pointer"
                onClick={() => setActivePanel(null)}
              >
                Appliquer
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {selectedRegion && (
            <button
              onClick={() => setSelectedRegion('')}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium cursor-pointer hover:bg-teal-100 transition-colors"
            >
              {selectedRegion}
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedType && (
            <button
              onClick={() => setSelectedType('')}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium cursor-pointer hover:bg-teal-100 transition-colors"
            >
              {propertyTypes.find(t => t.value === selectedType)?.label}
              <X className="w-3 h-3" />
            </button>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 50_000_000) && (
            <button
              onClick={() => setPriceRange([0, 50_000_000])}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium cursor-pointer hover:bg-teal-100 transition-colors"
            >
              {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 cursor-pointer transition-colors ml-1"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  )
}
