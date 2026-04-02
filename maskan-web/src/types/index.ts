export interface Property {
  id: string
  title: string
  description?: string
  property_type: "apartment" | "villa" | "studio" | "house" | "land" | "commercial" | "office"
  status: "available" | "sold" | "rented" | "pending"
  price: number
  currency: string
  area_sqm: number
  bedrooms: number
  bathrooms: number
  address?: string
  city: string
  region: string
  latitude: number | null
  longitude: number | null
  is_featured: boolean
  is_published?: boolean
  main_image_hash?: string
  agent_name?: string
  agent?: {
    id: string
    username: string
    email: string
    phone: string
  }
  images?: PropertyImage[]
  created_at: string
  updated_at?: string
}

export interface PropertyImage {
  id: string
  image_data: string
  image_hash: string
  order: number
  created_at: string
}

export interface PropertyFilters {
  search?: string
  property_type?: string
  status?: string
  region?: string
  city?: string
  price_min?: number
  price_max?: number
  bedrooms_min?: number
  bedrooms?: number
  bathrooms?: number
  area_min?: number
  area_max?: number
  is_featured?: boolean
  lat?: number
  lng?: number
  radius_km?: number
  ordering?: string
  page?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: string
  email: string
  username: string
  phone: string
  role: "client" | "agent" | "admin"
  is_verified: boolean
  is_active?: boolean
  avatar: string
  bio: string
  address: string
  city: string
  region: string
  developer_mode: boolean
  created_at: string
}

export interface MapPin {
  id: string
  title: string
  price: number
  currency: string
  property_type: string
  city: string
  latitude: number
  longitude: number
  status: string
}

export interface ApplicationField {
  id: string
  label: string
  field_type: "text" | "number" | "textarea" | "select" | "checkbox" | "file"
  placeholder: string
  help_text: string
  choices: string[]
  is_required: boolean
  order: number
  is_active: boolean
  created_at: string
}

export interface ApplicationResponse {
  id: string
  field: ApplicationField
  field_id?: string
  value: string
}

export interface AgentApplication {
  id: string
  user: User
  status: "pending" | "approved" | "rejected"
  admin_notes: string
  created_at: string
  reviewed_at: string | null
  reviewed_by: User | null
  responses: ApplicationResponse[]
}

export interface AdminUser {
  id: string
  email: string
  username: string
  phone: string
  role: "client" | "agent" | "admin"
  is_verified: boolean
  is_active: boolean
  developer_mode: boolean
  created_at: string
}
