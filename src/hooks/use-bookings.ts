'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { triggerBookingNotification } from '@/app/actions/notifications'

export interface BookingWithService {
  id: string
  booking_number: string
  customer_id: string | null
  service_id: string
  date: string
  time_slot: string
  status: string
  mode: string
  intake_data: Record<string, unknown>
  meet_link: string | null
  session_notes: string | null
  remedies_added: boolean
  payment_status: string
  amount: number
  razorpay_order_id: string | null
  created_at: string
  updated_at: string
  services: {
    name: string
    duration_minutes: number
    color_code: string
  } | null
  profiles: {
    name: string
    email: string
    phone: string | null
  } | null
}

interface UseBookingsOptions {
  customerId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { customerId, status, dateFrom, dateTo } = options

  return useQuery({
    queryKey: ['bookings', customerId, status, dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, color_code), profiles(name, email, phone)')
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true })

      if (customerId) query = query.eq('customer_id', customerId)
      if (status) query = query.eq('status', status)
      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)

      const { data, error } = await query
      if (error) throw error
      return data as BookingWithService[]
    },
  })
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, color_code), profiles(name, email, phone)')
        .eq('id', bookingId)
        .single()
      if (error) throw error
      return data as BookingWithService
    },
    enabled: !!bookingId,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }
      return data.booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Booking created successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bookingId,
      updates,
    }: {
      bookingId: string
      updates: Record<string, unknown>
    }) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update booking')
      }
      return data.booking
    },
    onSuccess: (_, { bookingId, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
      toast.success('Booking updated')

      if (updates.status === 'confirmed' || updates.meet_link) {
        triggerBookingNotification(bookingId).catch(console.error)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Booking cancelled')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
