'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface SiteSettings {
  footer_config?: {
    name: string
    address: string
    email: string
    phone: string
    tagline: string
    show_newsletter: boolean
  }
  social_links?: {
    instagram: string
    facebook: string
    youtube: string
    whatsapp: string
    twitter: string
    linkedin: string
  }
  cloudinary_config?: {
    cloud_name: string
    api_key: string
    upload_preset: string
    folder: string
  }
  contact_info?: {
    map_embed_url: string
    business_hours: string
    response_time: string
  }
  hero_images?: {
    desktop: string
    mobile: string
    desktops?: string[]
    mobiles?: string[]
    alt: string
  }
  logo_config?: {
    logo_url: string
    favicon_url: string
  }
  gst_enabled?: boolean
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error

      const settings: SiteSettings = {}
      data?.forEach((row) => {
        ;(settings as Record<string, unknown>)[row.key] = row.value
      })

      return settings
    },
  })
}
