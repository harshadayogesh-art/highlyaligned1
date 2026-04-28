import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'admin' | 'editor' | 'support'
  referral_code?: string
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({
      profile,
      isAdmin: ['admin', 'editor', 'support'].includes(profile?.role ?? ''),
    }),
  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, profile: null, isAdmin: false })
    window.location.href = '/'
  },
}))
