'use client'

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BookingWithService } from '@/hooks/use-bookings'

interface CalendarWeekViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  bookings: BookingWithService[]
  onBookingClick: (id: string) => void
  onSlotClick: (date: string, time: string) => void
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

export function CalendarWeekView({
  currentDate,
  onDateChange,
  bookings,
  onBookingClick,
  onSlotClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const bookingsByDayTime = bookings.reduce<Record<string, BookingWithService[]>>((acc, b) => {
    const key = `${b.date}@${b.time_slot}`
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  const getBookingsForSlot = (dateStr: string, hour: number) => {
    const hourStr = String(hour).padStart(2, '0')
    return bookings.filter((b) => {
      if (b.date !== dateStr) return false
      const [bh] = b.time_slot.split(':').map(Number)
      return bh === hour
    })
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => onDateChange(subWeeks(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-slate-700">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => onDateChange(addWeeks(currentDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 bg-slate-50 text-xs font-medium text-slate-500">
          <div className="px-2 py-2 border-r">Time</div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`px-1 py-2 text-center ${isSameDay(day, new Date()) ? 'bg-amber-50 text-amber-700' : ''}`}
            >
              <div>{format(day, 'EEE')}</div>
              <div className={`${isSameDay(day, new Date()) ? 'font-bold' : ''}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="max-h-[500px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-t min-h-[60px]">
              <div className="px-2 py-1.5 text-xs text-slate-400 border-r bg-slate-50/50">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const slotBookings = getBookingsForSlot(dateStr, hour)
                return (
                  <div
                    key={dateStr + hour}
                    className="border-r p-1 relative hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (slotBookings.length === 0) {
                        onSlotClick(dateStr, `${String(hour).padStart(2, '0')}:00`)
                      }
                    }}
                  >
                    {slotBookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onBookingClick(b.id)
                        }}
                        className="w-full text-left text-[10px] px-1.5 py-1 rounded mb-0.5 truncate text-white font-medium"
                        style={{ backgroundColor: b.services?.color_code || '#8b5cf6' }}
                        title={`${b.services?.name} — ${b.time_slot} — ${b.profiles?.name || 'Guest'}`}
                      >
                        {b.time_slot} {b.services?.name}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
