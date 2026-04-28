'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useBookings, useCancelBooking } from '@/hooks/use-bookings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock, Video, MapPin, Phone, MessageSquare, Trash2, ExternalLink, Loader2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-800',
}

const modeIcons: Record<string, React.ReactNode> = {
  video: <Video className='h-3.5 w-3.5' />,
  phone: <Phone className='h-3.5 w-3.5' />,
  chat: <MessageSquare className='h-3.5 w-3.5' />,
  in_person: <MapPin className='h-3.5 w-3.5' />,
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const cancelBooking = useCancelBooking()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/bookings')
    }
  }, [user, isLoading, router])

  const { data: bookings } = useBookings({ customerId: user?.id })

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const upcoming = (bookings || []).filter((b) => b.date >= today && b.status !== 'cancelled')
  const past = (bookings || []).filter((b) => b.date < today || b.status === 'cancelled' || b.status === 'completed' || b.status === 'no_show')

  const display = tab === 'upcoming' ? upcoming : past

  return (
    <div className='max-w-4xl'>
      <h1 className='text-xl font-bold text-slate-900 mb-4'>My Bookings</h1>

      <div className='flex gap-2 mb-4'>
        <Button
          size='sm'
          variant={tab === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcoming.length})
        </Button>
        <Button
          size='sm'
          variant={tab === 'past' ? 'default' : 'outline'}
          onClick={() => setTab('past')}
        >
          Past ({past.length})
        </Button>
      </div>

      {display.length === 0 && (
        <div className='text-center py-12 bg-slate-50 rounded-xl'>
          <p className='text-slate-500'>No {tab} bookings</p>
          <Button
            className='mt-4 bg-[#f59e0b] text-slate-900'
            onClick={() => router.push('/services')}
          >
            Book a Session
          </Button>
        </div>
      )}

      <div className='space-y-3'>
        {display.map((booking) => (
          <div
            key={booking.id}
            className='bg-white border border-slate-100 rounded-xl p-4 space-y-3'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div
                  className='w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold'
                  style={{ backgroundColor: booking.services?.color_code || '#999' }}
                >
                  {booking.services?.name?.charAt(0)}
                </div>
                <div>
                  <p className='font-medium text-sm'>{booking.services?.name}</p>
                  <p className='text-xs text-slate-500'>{booking.date} at {booking.time_slot}</p>
                </div>
              </div>
              <Badge className={`text-xs ${statusColors[booking.status] || ''}`}>
                {booking.status}
              </Badge>
            </div>

            <div className='flex items-center gap-3 text-xs text-slate-500'>
              <span className='flex items-center gap-1'>
                {modeIcons[booking.mode]}
                {booking.mode.replace('_', '-')}
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                {booking.services?.duration_minutes} min
              </span>
            </div>

            {booking.meet_link && booking.status === 'confirmed' && (
              <a
                href={booking.meet_link}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-sm text-[#f59e0b] font-medium'
              >
                <ExternalLink className='h-4 w-4' />
                Join Meet
              </a>
            )}

            {booking.session_notes && (
              <p className='text-xs text-slate-600 bg-slate-50 p-2 rounded'>
                {booking.session_notes}
              </p>
            )}

            {tab === 'upcoming' && booking.status !== 'cancelled' && (
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className='text-red-600 border-red-200 hover:bg-red-50'
                  onClick={() => setCancelId(booking.id)}
                >
                  <Trash2 className='h-3.5 w-3.5 mr-1' />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-slate-500'>This action cannot be undone.</p>
          <div className='flex gap-2 justify-end'>
            <Button variant='outline' onClick={() => setCancelId(null)}>
              Keep Booking
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                if (cancelId) cancelBooking.mutate(cancelId)
                setCancelId(null)
              }}
            >
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
