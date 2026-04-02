import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, X } from 'lucide-react'
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100_000_000])
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

  const handleSearch = () => {
    const filters: PropertyFilters = {}

    if (searchText) filters.search = searchText
    if (selectedRegion) filters.region = selectedRegion
    if (selectedType) filters.property_type = selectedType
    if (priceRange[0] > 0) filters.price_min = priceRange[0]
    if (priceRange[1] < 100_000_000) filters.price_max = priceRange[1]

    if (onSearch) {
      onSearch(filters)
    } else {
      const params = new URLSearchParams()
      params.set('type', activeTab)
      if (searchText) params.set('search', searchText)
      if (selectedRegion) params.set('region', selectedRegion)
      if (selectedType) params.set('property_type', selectedType)
      if (priceRange[0] > 0) params.set('price_min', String(priceRange[0]))
      if (priceRange[1] < 100_000_000) params.set('price_max', String(priceRange[1]))
      navigate(`/properties?${params.toString()}`)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowTypeDropdown(false)
      setShowBudgetDropdown(false)
      setShowRegionDropdown(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const hasFilters = selectedRegion || selectedType || priceRange[0] > 0 || priceRange[1] < 100_000_000

  return (
    <div className={cn("w-full", className)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {(['buy', 'rent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
              activeTab === tab
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab === 'buy' ? 'Acheter' : 'Louer'}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <motion.div
        className={cn(
          "flex items-center bg-white rounded-full shadow-search border border-slate-200 overflow-hidden",
          compact ? "gap-1 p-1.5" : "gap-2 p-2"
        )}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Text Search */}
        <div className="flex-1 min-w-0">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Rechercher une ville, un quartier..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Region Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setShowRegionDropdown(!showRegionDropdown); setShowTypeDropdown(false); setShowBudgetDropdown(false) }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              selectedRegion ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span className="max-w-[120px] truncate">{selectedRegion || 'Région'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {showRegionDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1">
                  <button
                    onClick={() => { setSelectedRegion(''); setShowRegionDropdown(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-slate-50",
                      !selectedRegion && "text-teal-700 font-medium"
                    )}
                  >
                    Toutes les régions
                  </button>
                  {regions.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setSelectedRegion(r); setShowRegionDropdown(false) }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-slate-50",
                        selectedRegion === r && "text-teal-700 font-medium bg-teal-50"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Property Type Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowBudgetDropdown(false); setShowRegionDropdown(false) }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              selectedType ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span>{selectedType ? propertyTypes.find(t => t.value === selectedType)?.label : 'Type de bien'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {showTypeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
              >
                <div className="p-1">
                  {propertyTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setSelectedType(t.value); setShowTypeDropdown(false) }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-slate-50",
                        selectedType === t.value && "text-teal-700 font-medium bg-teal-50"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Budget Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setShowBudgetDropdown(!showBudgetDropdown); setShowTypeDropdown(false); setShowRegionDropdown(false) }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap",
              (priceRange[0] > 0 || priceRange[1] < 100_000_000) ? "text-teal-700 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span className="hidden sm:inline">
              {priceRange[0] > 0 || priceRange[1] < 100_000_000
                ? `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`
                : 'Budget'}
            </span>
            <span className="sm:hidden">Budget</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {showBudgetDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm font-medium text-slate-700 mb-3">Quel est votre budget ?</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Budget min: {formatPrice(priceRange[0])}</p>
                    <Slider
                      value={[priceRange[0]]}
                      onValueChange={(v) => setPriceRange([v[0], priceRange[1]])}
                      min={0}
                      max={100_000_000}
                      step={500_000}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Budget max: {formatPrice(priceRange[1])}</p>
                    <Slider
                      value={[priceRange[1]]}
                      onValueChange={(v) => setPriceRange([priceRange[0], v[0]])}
                      min={0}
                      max={100_000_000}
                      step={500_000}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 cursor-pointer"
                    onClick={() => { setPriceRange([0, 100_000_000]); setShowBudgetDropdown(false) }}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-700 hover:bg-teal-800 cursor-pointer"
                    onClick={() => setShowBudgetDropdown(false)}
                  >
                    Appliquer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          size={compact ? 'sm' : 'default'}
          className="rounded-full bg-teal-700 hover:bg-teal-800 px-4 cursor-pointer"
        >
          <Search className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Rechercher</span>
        </Button>
      </motion.div>

      {/* Active Filters */}
      {hasFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap gap-2 mt-3"
        >
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
          {(priceRange[0] > 0 || priceRange[1] < 100_000_000) && (
            <button
              onClick={() => setPriceRange([0, 100_000_000])}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium cursor-pointer hover:bg-teal-100 transition-colors"
            >
              {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
