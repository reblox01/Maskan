import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Property, PropertyFilters, PaginatedResponse } from '@/types'

export function useProperties(filters: PropertyFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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

      const res = await api.get('/properties/', { params })
      setData(res.data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch properties')
      }
    } finally {
      setLoading(false)
    }
  }, [
    filters.search, filters.property_type, filters.status, filters.region,
    filters.city, filters.price_min, filters.price_max, filters.bedrooms,
    filters.bedrooms_min, filters.bathrooms, filters.area_min, filters.area_max,
    filters.is_featured, filters.lat, filters.lng, filters.radius_km,
    filters.ordering, filters.page,
  ])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return { data, loading, error, refetch: fetchProperties }
}

export function useFeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    setLoading(true)
    api.get(`/properties/${id}/`)
      .then(res => setProperty(res.data))
      .catch(() => setError('Property not found'))
      .finally(() => setLoading(false))
  }, [id])

  return { property, loading, error }
}
