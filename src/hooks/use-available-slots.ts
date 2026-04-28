'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ServiceSlotConfig {
  duration_minutes: number
  buffer_time_minutes: number
}

export function useAvailableSlots(date: string, serviceId: string) {
  return useQuery({
    queryKey: ['available-slots', date, serviceId],
    queryFn: async () => {
      const supabase = createClient()

      // Get service config
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes, buffer_time_minutes')
        .eq('id', serviceId)
        .single()

      if (serviceError || !service) throw serviceError || new Error('Service not found')

      // Get existing bookings for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot, status')
        .eq('date', date)
        .eq('service_id', serviceId)
        .neq('status', 'cancelled')

      if (bookingsError) throw bookingsError

      const bookedSlots = new Set(
        (bookings || [])
          .filter((b) => b.status !== 'cancelled')
          .map((b) => b.time_slot)
      )

      // Generate slots: 10 AM to 7 PM, 30-min intervals
      const startHour = 10
      const endHour = 19
      const slotDuration = service.duration_minutes + service.buffer_time_minutes

      const slots: { time: string; available: boolean }[] = []
      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`

          // Check if this slot or overlapping slots are booked
          const slotMinutes = hour * 60 + min
          let isAvailable = true

          for (const bookedTime of bookedSlots) {
            const [bh, bm] = bookedTime.split(':').map(Number)
            const bookedMinutes = bh * 60 + bm
            const overlap =
              slotMinutes < bookedMinutes + slotDuration &&
              slotMinutes + slotDuration > bookedMinutes
            if (overlap) {
              isAvailable = false
              break
            }
          }

          // Also don't show past slots for today
          const selectedDate = new Date(date)
          const today = new Date()
          if (
            selectedDate.toDateString() === today.toDateString() &&
            slotMinutes <= today.getHours() * 60 + today.getMinutes()
          ) {
            isAvailable = false
          }

          slots.push({ time, available: isAvailable })
        }
      }

      return slots
    },
    enabled: !!date && !!serviceId,
  })
}
