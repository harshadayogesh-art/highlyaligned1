'use client'

import { format, addDays, subDays, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BookingWithService } from '@/hooks/use-bookings'

interface CalendarDayViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  bookings: BookingWithService[]
  onBookingClick: (id: string) => void
  onSlotClick: (date: string, time: string) => void
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM

export function CalendarDayView({
  currentDate,
  onDateChange,
  bookings,
  onBookingClick,
  onSlotClick,
}: CalendarDayViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const dayBookings = bookings.filter((b) => b.date === dateStr)

  const getBookingsForHour = (hour: number) => {
    return dayBookings.filter((b) => {
      const [bh] = b.time_slot.split(':').map(Number)
      return bh === hour
    })
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => onDateChange(subDays(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className={`text-sm font-semibold ${isSameDay(currentDate, new Date()) ? 'text-amber-700' : 'text-slate-700'}`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => onDateChange(addDays(currentDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Timeline */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map((hour) => {
            const slotBookings = getBookingsForHour(hour)
            const timeLabel = format(new Date().setHours(hour, 0), 'h:mm a')
            return (
              <div
                key={hour}
                className="flex border-t min-h-[72px] hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (slotBookings.length === 0) {
                    onSlotClick(dateStr, `${String(hour).padStart(2, '0')}:00`)
                  }
                }}
              >
                <div className="w-20 shrink-0 px-3 py-2 text-xs text-slate-400 font-medium border-r bg-slate-50/50 flex items-start justify-end">
                  {timeLabel}
                </div>
                <div className="flex-1 p-2 space-y-1.5">
                  {slotBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onBookingClick(b.id)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-3"
                      style={{ backgroundColor: b.services?.color_code || '#8b5cf6' }}
                    >
                      <span className="text-xs opacity-90">{b.time_slot}</span>
                      <span className="flex-1">{b.services?.name}</span>
                      <span className="text-xs opacity-90">{b.profiles?.name || 'Guest'}</span>
                      <span className="text-xs opacity-90">₹{b.amount}</span>
                    </button>
                  ))}
                  {slotBookings.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-300 py-3">
                      Click to book
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
