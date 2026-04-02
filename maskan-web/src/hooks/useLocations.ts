import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useCities() {
  const [cities, setCities] = useState<string[]>([])
  useEffect(() => {
    api.get('/properties/cities/')
      .then(res => setCities(res.data))
      .catch(() => setCities([]))
  }, [])
  return cities
}

export function useRegions() {
  const [regions, setRegions] = useState<string[]>([])
  useEffect(() => {
    api.get('/properties/regions/')
      .then(res => setRegions(res.data))
      .catch(() => setRegions([]))
  }, [])
  return regions
}
