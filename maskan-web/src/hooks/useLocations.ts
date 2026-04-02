import { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'

let citiesCache: string[] | null = null
let regionsCache: string[] | null = null

export function useCities() {
  const [cities, setCities] = useState<string[]>(citiesCache || [])
  const fetched = useRef(citiesCache !== null)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    api.get('/properties/cities/')
      .then(res => { citiesCache = res.data; setCities(res.data) })
      .catch(() => setCities([]))
  }, [])
  return cities
}

export function useRegions() {
  const [regions, setRegions] = useState<string[]>(regionsCache || [])
  const fetched = useRef(regionsCache !== null)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    api.get('/properties/regions/')
      .then(res => { regionsCache = res.data; setRegions(res.data) })
      .catch(() => setRegions([]))
  }, [])
  return regions
}
