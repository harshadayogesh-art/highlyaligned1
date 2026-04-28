'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setProfile = useAuthStore((s) => s.setProfile)

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string
      updates: { name?: string; phone?: string }
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setProfile(data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update profile'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => {
      const supabase = createClient()
      // First verify current password by signing in
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) throw new Error('User email not found')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Current password is incorrect')

      // Then update password
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to change password'),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_user')
      if (error) {
        // Fallback: delete via API if RPC doesn't exist
        const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to delete account' }))
          throw new Error(err.error)
        }
      }
    },
    onSuccess: () => {
      toast.success('Account deleted')
      window.location.href = '/'
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete account'),
  })
}
