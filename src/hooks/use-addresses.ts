'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  email: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  landmark: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export function useAddresses(userId?: string) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId!)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Address[]
    },
    enabled: !!userId,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Omit<Address, 'id' | 'created_at' | 'updated_at'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('addresses')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Address
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address saved')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save address'),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('addresses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Address
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address updated')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update address'),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('addresses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address deleted')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete address'),
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, addressId }: { userId: string; addressId: string }) => {
      const supabase = createClient()
      // Unset all defaults first
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
      // Set the selected one as default
      const { data, error } = await supabase
        .from('addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', addressId)
        .select()
        .single()
      if (error) throw error
      return data as Address
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Default address updated')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update default address'),
  })
}
