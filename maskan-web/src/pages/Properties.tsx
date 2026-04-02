import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Map, Grid3X3, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchFilter from '@/components/SearchFilter'
import PropertyCard from '@/components/PropertyCard'
import PropertyMap from '@/components/PropertyMap'
import { useProperties } from '@/hooks/useProperties'
import { cn } from '@/lib/utils'
import type { PropertyFilters, MapPin } from '@/types'

const sortOptions = [
  { value: '-created_at', label: 'Plus récents' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: 'area_sqm', label: 'Surface croissante' },
  { value: '-area_sqm', label: 'Surface décroissante' },
]

export default function Properties() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [ordering, setOrdering] = useState('-created_at')
  const [page] = useState(1)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [searchFilters, setSearchFilters] = useState<PropertyFilters>({})

  const filters: PropertyFilters = useMemo(() => ({
    ...searchFilters,
    ordering,
    page,
  }), [searchFilters, ordering, page])

  const { data, loading } = useProperties(filters)

  const handleSearch = useCallback((newFilters: PropertyFilters) => {
    setSearchFilters(newFilters)
  }, [])

  const mapPins: MapPin[] = useMemo(() => {
    if (!data?.results) return []
    return data.results
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency,
        property_type: p.property_type,
        city: p.city,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        status: p.status,
      }))
  }, [data])

  const totalCount = data?.count || 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchFilter compact onSearch={handleSearch} />

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-teal-900">{totalCount}</span>{' '}
              {totalCount === 1 ? 'bien immobilier' : 'biens immobiliers'}
            </p>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  {sortOptions.find(s => s.value === ordering)?.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-1">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setOrdering(opt.value); setShowSortDropdown(false) }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-slate-50",
                          ordering === opt.value && "text-teal-700 font-medium bg-teal-50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md cursor-pointer transition-colors",
                    viewMode === 'grid' ? "bg-white shadow-sm text-teal-700" : "text-slate-400"
                  )}
                  aria-label="Vue grille"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    "p-1.5 rounded-md cursor-pointer transition-colors",
                    viewMode === 'map' ? "bg-white shadow-sm text-teal-700" : "text-slate-400"
                  )}
                  aria-label="Vue carte"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'grid' ? (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden">
                    <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-slate-100 rounded animate-pulse w-24" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.results.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
                }}
              >
                {data.results.map((property, i) => (
                  <PropertyCard key={property.id} property={property} index={i} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">Aucun bien trouvé</p>
                <p className="text-sm text-slate-400 mt-1">Essayez de modifier vos critères de recherche</p>
              </div>
            )}

            {/* Pagination */}
            {data && totalCount > 20 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={!data.previous} className="cursor-pointer">Précédent</Button>
                <span className="text-sm text-slate-500 px-3">Page {page} sur {Math.ceil(totalCount / 20)}</span>
                <Button variant="outline" size="sm" disabled={!data.next} className="cursor-pointer">Suivant</Button>
              </div>
            )}
          </>
        ) : (
          <PropertyMap pins={mapPins} height="calc(100vh - 200px)" />
        )}
      </div>
    </div>
  )
}
