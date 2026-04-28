'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useService } from '@/hooks/use-services'
import { useCreateBooking } from '@/hooks/use-bookings'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Clock, Calendar as CalendarIcon, Video, Loader2, Star, CheckCircle } from 'lucide-react'

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '06:30 PM']

export default function ServiceBookingPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const { data: service, isLoading } = useService(slug as string)
  const createBooking = useCreateBooking()

  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [booked, setBooked] = useState(false)

  const handleBook = async () => {
    if (!user) {
      toast.error('Please login to book a service')
      router.push(`/login?redirect=/services/${slug}`)
      return
    }
    if (!date || !timeSlot) {
      toast.error('Please select a date and time slot')
      return
    }

    setIsProcessing(true)
    try {
      await createBooking.mutateAsync({
        booking_number: `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        customer_id: user.id,
        service_id: service!.id,
        date,
        time_slot: timeSlot,
        status: 'confirmed',
        mode: 'video',
        intake_data: { notes },
        payment_status: 'pending',
        amount: service!.price,
      })

      setBooked(true)
      toast.success('Booking confirmed! 🎉')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-xl text-slate-600">Service not found.</p>
        </div>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h1>
          <p className="text-slate-600">
            Your session for <span className="font-semibold">{service.name}</span> has been booked.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 space-y-1">
            <p><span className="font-medium">Date:</span> {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><span className="font-medium">Time:</span> {timeSlot}</p>
            <p><span className="font-medium">Duration:</span> {service.duration_minutes} mins</p>
          </div>
          <p className="text-xs text-slate-500">
            Payment of ₹{service.price} will be collected before or during the session.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => router.push('/account?tab=bookings')}
              className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold"
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBooked(false)
                setDate('')
                setTimeSlot('')
                setNotes('')
                setIsProcessing(false)
              }}
            >
              Book Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — Service Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {service.image_url && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6">
                <Image src={service.image_url} alt={service.name} fill className="object-cover" />
              </div>
            )}
            {!service.image_url && service.color_code && (
              <div
                className="w-full h-32 rounded-xl mb-6 flex items-center justify-center text-white text-5xl font-bold"
                style={{ backgroundColor: service.color_code }}
              >
                {service.name.charAt(0)}
              </div>
            )}
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">{service.name}</h1>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {service.description || 'A personalized session to help you align, heal and grow.'}
            </p>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="font-medium">{service.duration_minutes} mins</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <Video className="h-5 w-5 text-violet-500" />
                <span className="font-medium">Online Session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Booking Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-violet-600" />
            Schedule Your Session
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">Select Date</Label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Available Timeslots</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeSlot(time)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      timeSlot === time
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-slate-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base">What would you like to discuss? (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your primary focus or questions..."
                className="resize-none h-24"
              />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600 font-medium">Session Fee</span>
                <span className="text-2xl font-black text-violet-800">₹{service.price}</span>
              </div>

              <Button
                onClick={handleBook}
                disabled={isProcessing || !date || !timeSlot}
                className="w-full h-12 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Confirming...</>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Payment will be collected before or during your session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
