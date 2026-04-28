'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useAvailableSlots } from '@/hooks/use-available-slots'
import { useCreateBooking } from '@/hooks/use-bookings'
import { loadRazorpayScript, createRazorpayOrder, openRazorpayCheckout } from '@/lib/razorpay'
import { toast } from 'sonner'
import { CalendarDays, Clock, ChevronLeft, CheckCircle } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  mode: string[]
  color_code: string
  description: string | null
}

function BookingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedService = searchParams.get('service')
  const { user, profile } = useAuth()
  const createBooking = useCreateBooking()

  const [step, setStep] = useState(preselectedService ? 2 : 1)
  const [userSelectedService, setUserSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [intake, setIntake] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    dob: '',
    birth_time: '',
    birth_location: '',
    question: '',
    concern: '',
    language: 'English',
  })
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingData, setBookingData] = useState<{ id: string; booking_number: string } | null>(null)

  const { data: services } = useQuery({
    queryKey: ['services-active'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Service[]
    },
  })

  const selectedService = useMemo(() => {
    if (userSelectedService) return userSelectedService
    if (preselectedService && services) {
      return services.find((s) => s.id === preselectedService) || null
    }
    return null
  }, [userSelectedService, preselectedService, services])

  const { data: slots } = useAvailableSlots(
    selectedDate,
    selectedService?.id || ''
  )

  const generateCalendarDays = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d)
    }
    return days
  }

  const calendarDays = generateCalendarDays()

  const handleConfirm = async (payNow: boolean) => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedMode) return

    const payload = {
      booking_number: `BK-${Date.now()}`,
      customer_id: user?.id || null,
      service_id: selectedService.id,
      date: selectedDate,
      time_slot: selectedTime,
      mode: selectedMode,
      intake_data: intake,
      amount: selectedService.price,
      status: 'pending',
      payment_status: payNow ? 'pending' : 'pending',
    }

    const booking = await createBooking.mutateAsync(payload)
    setBookingData(booking)

    if (payNow && booking) {
      const rzpOrder = await createRazorpayOrder({
        amount: selectedService.price,
        receipt: booking.booking_number,
      })

      const supabase = createClient()
      await supabase.from('bookings').update({
        razorpay_order_id: rzpOrder.orderId,
      }).eq('id', booking.id)

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Payment failed to load')
        return
      }

      openRazorpayCheckout({
        orderId: rzpOrder.orderId,
        amount: selectedService.price,
        name: 'HighlyAligned',
        description: `Booking ${booking.booking_number}`,
        prefill: {
          name: intake.name,
          email: intake.email,
          contact: intake.phone,
        },
        onSuccess: async (response) => {
          const supabase = createClient()
          await supabase.from('bookings').update({
            payment_status: 'captured',
            razorpay_order_id: response.razorpay_order_id,
            status: 'confirmed',
          }).eq('id', booking.id)
          setBookingComplete(true)
        },
      })
    } else {
      setBookingComplete(true)
    }
  }

  if (bookingComplete && bookingData) {
    return (
      <div className='px-4 py-12 max-w-md mx-auto text-center space-y-6'>
        <CheckCircle className='h-16 w-16 text-emerald-500 mx-auto' />
        <h1 className='text-2xl font-bold'>Booking Confirmed!</h1>
        <p className='text-slate-500'>Your booking #{bookingData.booking_number} has been received.</p>
        {selectedMode === 'video' && (
          <p className='text-sm text-slate-500'>Meet link will be sent 1 hour before your session.</p>
        )}
        <Button onClick={() => router.push('/account/bookings')} className='bg-[#f59e0b] text-slate-900'>
          My Bookings
        </Button>
      </div>
    )
  }

  return (
    <div className='px-4 py-6 max-w-2xl mx-auto'>
      <div className='flex items-center gap-2 mb-6'>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className='text-slate-500 hover:text-slate-900'>
            <ChevronLeft className='h-5 w-5' />
          </button>
        )}
        <h1 className='text-xl font-bold text-slate-900'>Book a Session</h1>
      </div>

      {/* Step 1: Service */}
      {step === 1 && (
        <div className='space-y-3'>
          <p className='text-sm text-slate-500'>Step 1 of 5: Select a service</p>
          {services?.map((svc) => (
            <button
              key={svc.id}
              onClick={() => { setUserSelectedService(svc); setSelectedMode(svc.mode[0]); setStep(2) }}
              className={`w-full text-left bg-white border rounded-xl p-4 space-y-2 transition-colors ${
                selectedService?.id === svc.id ? 'border-[#f59e0b] bg-amber-50' : 'border-slate-100'
              }`}
            >
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>{svc.name}</h3>
                <span className='font-bold text-emerald-600'>Rs.{svc.price}</span>
              </div>
              <p className='text-xs text-slate-500'>{svc.duration_minutes} min</p>
              <div className='flex gap-1'>
                {svc.mode.map((m) => (
                  <Badge key={m} variant='outline' className='text-[10px]'>{m}</Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && selectedService && (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Step 2 of 5: Choose date & time</p>
          <div>
            <Label className='flex items-center gap-2 mb-2'>
              <CalendarDays className='h-4 w-4' /> Select Date
            </Label>
            <div className='grid grid-cols-7 gap-1'>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <div key={d} className='text-center text-xs text-slate-400 py-1'>{d}</div>
              ))}
              {calendarDays.map((d) => {
                const dateStr = d.toISOString().split('T')[0]
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                    className={`text-center text-xs py-2 rounded-lg ${
                      isSelected ? 'bg-[#f59e0b] text-white' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDate && slots && (
            <div>
              <Label className='flex items-center gap-2 mb-2'>
                <Clock className='h-4 w-4' /> Available Slots
              </Label>
              <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`text-xs py-2 rounded-lg border ${
                      selectedTime === slot.time
                        ? 'border-[#f59e0b] bg-amber-50 text-slate-900'
                        : slot.available
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            className='w-full bg-[#f59e0b] text-slate-900'
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(3)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 3: Mode */}
      {step === 3 && selectedService && (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Step 3 of 5: Select mode</p>
          <div className='grid grid-cols-2 gap-3'>
            {selectedService.mode.map((m) => (
              <button
                key={m}
                onClick={() => { setSelectedMode(m); setStep(4) }}
                className={`p-4 rounded-xl border text-center capitalize ${
                  selectedMode === m ? 'border-[#f59e0b] bg-amber-50' : 'border-slate-100'
                }`}
              >
                {m.replace('_', '-')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Intake */}
      {step === 4 && (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Step 4 of 5: Your details</p>
          <div className='space-y-3'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Name</Label>
                <Input value={intake.name} onChange={(e) => setIntake({ ...intake, name: e.target.value })} />
              </div>
              <div className='space-y-1'>
                <Label>Phone</Label>
                <Input value={intake.phone} onChange={(e) => setIntake({ ...intake, phone: e.target.value })} />
              </div>
              <div className='space-y-1 sm:col-span-2'>
                <Label>Email</Label>
                <Input value={intake.email} onChange={(e) => setIntake({ ...intake, email: e.target.value })} />
              </div>
            </div>

            {selectedService?.name.toLowerCase().includes('astrology') || selectedService?.name.toLowerCase().includes('natal') ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='space-y-1'>
                  <Label>Date of Birth</Label>
                  <Input type='date' value={intake.dob} onChange={(e) => setIntake({ ...intake, dob: e.target.value })} />
                </div>
                <div className='space-y-1'>
                  <Label>Birth Time</Label>
                  <Input type='time' value={intake.birth_time} onChange={(e) => setIntake({ ...intake, birth_time: e.target.value })} />
                </div>
                <div className='space-y-1'>
                  <Label>Birth Location</Label>
                  <Input value={intake.birth_location} onChange={(e) => setIntake({ ...intake, birth_location: e.target.value })} />
                </div>
              </div>
            ) : null}

            {selectedService?.name.toLowerCase().includes('tarot') || selectedService?.name.toLowerCase().includes('oracle') ? (
              <div className='space-y-1'>
                <Label>Your Question</Label>
                <Textarea value={intake.question} onChange={(e) => setIntake({ ...intake, question: e.target.value })} />
              </div>
            ) : null}

            {selectedService?.name.toLowerCase().includes('healing') ? (
              <div className='space-y-1'>
                <Label>Current Health Concern</Label>
                <Textarea value={intake.concern} onChange={(e) => setIntake({ ...intake, concern: e.target.value })} />
              </div>
            ) : null}

            <div className='space-y-1'>
              <Label>Preferred Language</Label>
              <select
                value={intake.language}
                onChange={(e) => setIntake({ ...intake, language: e.target.value })}
                className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Gujarati</option>
              </select>
            </div>
          </div>

          <Button
            className='w-full bg-[#f59e0b] text-slate-900'
            disabled={!intake.name || !intake.phone || !intake.email}
            onClick={() => setStep(5)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && selectedService && (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Step 5 of 5: Review & Confirm</p>
          <div className='bg-slate-50 rounded-xl p-4 space-y-2'>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Service</span>
              <span className='font-medium'>{selectedService.name}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Date</span>
              <span className='font-medium'>{selectedDate}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Time</span>
              <span className='font-medium'>{selectedTime}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Mode</span>
              <span className='font-medium capitalize'>{selectedMode.replace('_', '-')}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Duration</span>
              <span className='font-medium'>{selectedService.duration_minutes} min</span>
            </div>
            <div className='flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200'>
              <span>Total</span>
              <span>Rs.{selectedService.price}</span>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              className='flex-1 bg-[#f59e0b] text-slate-900'
              onClick={() => handleConfirm(true)}
              disabled={createBooking.isPending}
            >
              Pay Now
            </Button>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => handleConfirm(false)}
              disabled={createBooking.isPending}
            >
              Pay Later
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className='px-4 py-12 text-center text-slate-500'>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  )
}
