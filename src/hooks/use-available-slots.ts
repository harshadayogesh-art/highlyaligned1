'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ServiceSlotConfig {
  duration_minutes: number
  buffer_time_minutes: number
  working_hours_start?: string | null
  working_hours_end?: string | null
  slot_interval_minutes?: number | null
  blocked_dates?: string[] | null
}

export interface Slot {
  time: string
  available: boolean
}

export function useAvailableSlots(date: string, serviceId: string) {
  return useQuery({
    queryKey: ['available-slots', date, serviceId],
    queryFn: async () => {
      const supabase = createClient()

      // Get service config
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes, buffer_time_minutes, working_hours_start, working_hours_end, slot_interval_minutes, blocked_dates')
        .eq('id', serviceId)
        .single()

      if (serviceError || !service) throw serviceError || new Error('Service not found')

      const config: ServiceSlotConfig = {
        duration_minutes: service.duration_minutes || 60,
        buffer_time_minutes: service.buffer_time_minutes || 15,
        working_hours_start: service.working_hours_start || '10:00',
        working_hours_end: service.working_hours_end || '19:00',
        slot_interval_minutes: service.slot_interval_minutes || 30,
        blocked_dates: service.blocked_dates || [],
      }

      // Check blocked dates
      if (config.blocked_dates?.includes(date)) {
        return [] as Slot[]
      }

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

      // Parse working hours
      const [startHour, startMin] = (config.working_hours_start || '10:00').split(':').map(Number)
      const [endHour, endMin] = (config.working_hours_end || '19:00').split(':').map(Number)
      const startTotalMinutes = startHour * 60 + startMin
      const endTotalMinutes = endHour * 60 + endMin
      const interval = config.slot_interval_minutes || 30
      const slotDuration = config.duration_minutes + config.buffer_time_minutes

      const slots: Slot[] = []
      for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += interval) {
        const hour = Math.floor(minutes / 60)
        const min = minutes % 60
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`

        // Check if this slot or overlapping slots are booked
        let isAvailable = true

        for (const bookedTime of bookedSlots) {
          const [bh, bm] = bookedTime.split(':').map(Number)
          const bookedMinutes = bh * 60 + bm
          const overlap =
            minutes < bookedMinutes + slotDuration &&
            minutes + slotDuration > bookedMinutes
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
          minutes <= today.getHours() * 60 + today.getMinutes()
        ) {
          isAvailable = false
        }

        slots.push({ time, available: isAvailable })
      }

      return slots
    },
    enabled: !!date && !!serviceId,
  })
}
