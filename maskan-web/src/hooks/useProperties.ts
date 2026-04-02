import { useState, useEffect, useRef, useCallback } from 'react'
import api from '@/lib/api'
import type { Property, PropertyFilters, PaginatedResponse } from '@/types'

export function useProperties(filters: PropertyFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const params: Record<string, string> = {}
    if (filters.search) params.search = filters.search
    if (filters.property_type) params.property_type = filters.property_type
    if (filters.status) params.status = filters.status
    if (filters.region) params.region = filters.region
    if (filters.city) params.city = filters.city
    if (filters.price_min) params.price_min = String(filters.price_min)
    if (filters.price_max) params.price_max = String(filters.price_max)
    if (filters.bedrooms) params.bedrooms = String(filters.bedrooms)
    if (filters.bedrooms_min) params.bedrooms_min = String(filters.bedrooms_min)
    if (filters.bathrooms) params.bathrooms = String(filters.bathrooms)
    if (filters.area_min) params.area_min = String(filters.area_min)
    if (filters.area_max) params.area_max = String(filters.area_max)
    if (filters.is_featured !== undefined) params.is_featured = String(filters.is_featured)
    if (filters.lat) params.lat = String(filters.lat)
    if (filters.lng) params.lng = String(filters.lng)
    if (filters.radius_km) params.radius_km = String(filters.radius_km)
    if (filters.ordering) params.ordering = filters.ordering
    if (filters.page) params.page = String(filters.page)

    api.get('/properties/', { params, signal: controller.signal })
      .then(res => { if (!controller.signal.aborted) setData(res.data) })
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError('Failed to fetch')
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [filtersKey])

  const refetch = useCallback(() => {
    // Force re-fetch by triggering a state change
    setData(null)
    setLoading(true)
  }, [])

  return { data, loading, error, refetch }
}

export function useFeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    api.get('/properties/featured/')
      .then(res => setProperties(res.data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [])

  return { properties, loading }
}

export function usePropertyDetail(id: string) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api.get(`/properties/${id}/`)
      .then(res => setProperty(res.data))
      .catch(() => setError('Property not found'))
      .finally(() => setLoading(false))
  }, [id])

  return { property, loading, error }
}
