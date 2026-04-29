// HighlyAligned — Manual Database Types
// Matches supabase-schema.sql + phase6-schema.sql
// Update when schema changes.

export type Role = 'customer' | 'admin' | 'editor' | 'support'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded'
export type PaymentMode = 'online' | 'cod'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type BookingPaymentStatus = 'pending' | 'captured' | 'refunded'
export type ServiceMode = 'video' | 'phone' | 'chat' | 'in_person'

export type ProductStatus = 'draft' | 'published' | 'out_of_stock' | 'hidden'
export type BlogStatus = 'draft' | 'published' | 'scheduled'
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'cold'
export type LeadSource = 'free_report' | 'whatsapp' | 'manual' | 'referral'
export type RemedyStatus = 'active' | 'completed'
export type RemedyLogStatus = 'done' | 'skipped'
export type ReferralStatus = 'pending' | 'paid'
export type CouponType = 'percentage' | 'fixed' | 'free_shipping'
export type BannerPosition = 'hero' | 'section_2' | 'section_3'

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  email: string
  phone?: string | null
  role: Role
  referral_code?: string | null
  created_at: string
  updated_at: string
}

export interface Setting {
  id: string
  key: string
  value: unknown
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  type: 'product' | 'service'
  parent_id?: string | null
  image?: string | null
  description?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  how_to_use?: string | null
  energization_process?: string | null
  price: number
  mrp: number
  stock: number
  sku?: string | null
  category_id?: string | null
  images: string[]
  gst_applicable: boolean
  gst_rate: number
  weight_grams?: number | null
  status: ProductStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // joined
  categories?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export interface Service {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  price: number
  mode: ServiceMode[]
  buffer_time_minutes: number
  category_id?: string | null
  color_code: string
  is_active: boolean
  sort_order: number
  created_at: string
  // Availability config
  working_hours_start?: string | null
  working_hours_end?: string | null
  slot_interval_minutes?: number | null
  blocked_dates?: string[] | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string | null
  quantity: number
  price: number
  total: number
  gst_rate: number
  gst_amount: number
  // joined
  products?: Pick<Product, 'id' | 'name' | 'images' | 'slug'> | null
}

export interface Order {
  id: string
  order_number: string
  customer_id?: string | null
  status: OrderStatus
  subtotal: number
  gst_amount: number
  discount_amount: number
  shipping_amount: number
  final_total: number
  payment_mode: PaymentMode
  payment_status: PaymentStatus
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  shipping_address: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  courier_name?: string | null
  tracking_id?: string | null
  shipping_label_url?: string | null
  cod_collected: boolean
  cod_collection_date?: string | null
  gst_enabled_at_checkout: boolean
  admin_notes?: string | null
  created_at: string
  updated_at: string
  // joined
  profiles?: Pick<Profile, 'id' | 'name' | 'email' | 'phone'> | null
  order_items?: OrderItem[]
}

export interface Booking {
  id: string
  booking_number: string
  customer_id?: string | null
  service_id?: string | null
  date: string
  time_slot: string
  status: BookingStatus
  mode: ServiceMode
  intake_data: Record<string, unknown>
  meet_link?: string | null
  session_notes?: string | null
  remedies_added: boolean
  payment_status: BookingPaymentStatus
  amount: number
  created_at: string
  updated_at: string
  // joined
  profiles?: Pick<Profile, 'id' | 'name' | 'email' | 'phone'> | null
  services?: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'color_code'> | null
}

export interface Remedy {
  id: string
  customer_id?: string | null
  booking_id?: string | null
  title: string
  description?: string | null
  duration_days?: number | null
  frequency?: string | null
  instructions?: string | null
  attachment_url?: string | null
  status: RemedyStatus
  created_by?: string | null
  created_at: string
}

export interface RemedyLog {
  id: string
  remedy_id: string
  customer_id?: string | null
  log_date: string
  status: RemedyLogStatus
  note?: string | null
  created_at: string
}

export interface Lead {
  id: string
  name: string
  mobile: string
  email?: string | null
  dob?: string | null
  birth_time?: string | null
  birth_location?: string | null
  area_of_life_id?: string | null
  customer_question?: string | null
  ai_answer?: string | null
  ai_prompt_used?: string | null
  source: LeadSource
  status: LeadStatus
  converted_to_customer_id?: string | null
  report_data_json: Record<string, unknown>
  created_at: string
}

export interface LeadMagnetArea {
  id: string
  name: string
  icon: string
  slug: string
  sort_order: number
  is_active: boolean
  ai_prompt: string
  created_at: string
}

export interface Referral {
  id: string
  referrer_id?: string | null
  referee_id?: string | null
  code_used: string
  order_id?: string | null
  booking_id?: string | null
  commission_amount: number
  status: ReferralStatus
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  min_order_amount: number
  max_uses?: number | null
  usage_count: number
  per_customer_limit: number
  valid_from?: string | null
  valid_to?: string | null
  applicable_to: string[]
  is_active: boolean
  created_at: string
}

export interface Banner {
  id: string
  title: string
  image: string
  link?: string | null
  position: BannerPosition
  sort_order: number
  start_date?: string | null
  end_date?: string | null
  is_active: boolean
  created_at: string
}

export interface Page {
  id: string
  slug: string
  title: string
  content?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  featured_image?: string | null
  category?: string | null
  tags: string[]
  author: string
  status: BlogStatus
  published_at?: string | null
  views: number
  meta_title?: string | null
  meta_description?: string | null
  created_at: string
  updated_at: string
}

export interface LegalPage {
  id: string
  slug: string
  title: string
  content: string
  meta_description: string
  is_published: boolean
  last_updated: string
  created_at: string
  updated_at: string
}

// ─── Pagination Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
