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
  is_verified?: boolean
  verification_status?: "pending" | "approved" | "rejected"
  rejection_reason?: string
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

export type UserRole = "acquereur" | "vendeur" | "admin"
export type VerificationStatus = "pending" | "approved" | "rejected"

export interface User {
  id: string
  email: string
  username: string
  phone: string
  role: UserRole
  current_mode: UserRole
  is_verified: boolean
  is_active?: boolean
  avatar: string
  bio: string
  address: string
  city: string
  region: string
  developer_mode: boolean
  created_at: string
  is_vendeur_active?: boolean
  can_switch_role?: boolean
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
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
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

export interface VendeurApplication {
  id: string
  user: User
  status: VerificationStatus
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
  role: UserRole
  current_mode: UserRole
  is_verified: boolean
  is_active: boolean
  developer_mode: boolean
  created_at: string
}

export interface PropertyAdminItem {
  id: string
  title: string
  property_type: string
  status: string
  price: number
  currency: string
  city: string
  region: string
  is_published: boolean
  is_verified: boolean
  verification_status: VerificationStatus
  rejection_reason: string
  agent_name: string
  agent_email: string
  reviewed_by_name: string | null
  reviewed_at: string | null
  created_at: string
}

export interface PropertyAdminDetail {
  id: string
  title: string
  description: string
  property_type: string
  status: string
  price: number
  currency: string
  area_sqm: number
  bedrooms: number
  bathrooms: number
  address: string
  city: string
  region: string
  latitude: number | null
  longitude: number | null
  is_published: boolean
  is_verified: boolean
  is_featured: boolean
  verification_status: VerificationStatus
  rejection_reason: string
  agent: {
    id: string
    username: string
    email: string
    phone: string
  }
  images: PropertyImage[]
  reviewed_by: { id: string; username: string } | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface PropertyVerificationRequest {
  action: "approve" | "reject"
  rejection_reason?: string
}