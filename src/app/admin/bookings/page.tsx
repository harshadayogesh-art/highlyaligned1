'use client'

import { useState } from 'react'
import { useBookings } from '@/hooks/use-bookings'
import { BookingDetailDrawer } from '@/components/admin/booking-detail-drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-800',
}

export default function AdminBookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [detailBooking, setDetailBooking] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: bookings } = useBookings()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const bookingsByDate = (bookings || []).reduce<Record<string, NonNullable<typeof bookings>[number][]>>((acc, b) => {
    if (!acc[b.date]) acc[b.date] = []
    acc[b.date].push(b)
    return acc
  }, {})

  const selectedBookings = bookingsByDate[selectedDate] || []

  const openDetail = (id: string) => {
    setDetailBooking(id)
    setDetailOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Bookings</h1>
        <div className='flex gap-2'>
          {(['month', 'week', 'day'] as const).map((v) => (
            <Button
              key={v}
              size='sm'
              variant={view === v ? 'default' : 'outline'}
              onClick={() => setView(v)}
              className='capitalize'
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className='flex items-center justify-between'>
        <Button size='sm' variant='ghost' onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <h2 className='text-lg font-semibold'>{format(currentDate, 'MMMM yyyy')}</h2>
        <Button size='sm' variant='ghost' onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Calendar */}
        <div className='lg:col-span-2'>
          {view === 'month' && (
            <div className='border rounded-lg overflow-hidden'>
              <div className='grid grid-cols-7 bg-slate-50 text-xs font-medium text-slate-500'>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                  <div key={d} className='px-2 py-2 text-center'>{d}</div>
                ))}
              </div>
              <div className='grid grid-cols-7'>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayBookings = bookingsByDate[dateStr] || []
                  const isSelected = selectedDate === dateStr
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[80px] p-2 border-t border-r text-left ${
                        !isSameMonth(day, currentDate) ? 'bg-slate-50 text-slate-300' : 'bg-white'
                      } ${isSelected ? 'ring-2 ring-[#f59e0b] ring-inset' : ''} ${isToday(day) ? 'bg-amber-50' : ''}`}
                    >
                      <span className={`text-sm font-medium ${isToday(day) ? 'text-[#f59e0b]' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {dayBookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className='w-2 h-2 rounded-full'
                            style={{ backgroundColor: b.services?.color_code || '#999' }}
                          />
                        ))}
                        {dayBookings.length > 3 && (
                          <span className='text-[10px] text-slate-400'>+{dayBookings.length - 3}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-3'>
          <h3 className='font-semibold text-slate-900'>
            {format(new Date(selectedDate), 'EEEE, MMM d')}
          </h3>
          {selectedBookings.length === 0 && (
            <p className='text-sm text-slate-500'>No bookings for this day.</p>
          )}
          {selectedBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => openDetail(b.id)}
              className='bg-white border border-slate-100 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow'
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{b.time_slot}</span>
                <Badge className={`text-xs ${statusColors[b.status] || ''}`}>
                  {b.status}
                </Badge>
              </div>
              <p className='text-sm text-slate-900 font-medium'>{b.services?.name}</p>
              <p className='text-xs text-slate-500'>{b.profiles?.name || 'Guest'} • ₹{b.amount}</p>
            </div>
          ))}
        </div>
      </div>

      <BookingDetailDrawer
        bookingId={detailBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
