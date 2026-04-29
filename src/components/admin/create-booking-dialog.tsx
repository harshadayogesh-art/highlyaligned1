'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useServices } from '@/hooks/use-services'
import { useAvailableSlots } from '@/hooks/use-available-slots'
import { useCreateBooking } from '@/hooks/use-bookings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CalendarDays, Clock, User, Video, Phone, MessageCircle, MapPin } from 'lucide-react'

interface CreateBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillDate?: string
  prefillTime?: string
  prefillServiceId?: string
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  prefillDate,
  prefillTime,
  prefillServiceId,
}: CreateBookingDialogProps) {
  const { data: services } = useServices({ activeOnly: true })
  const createBooking = useCreateBooking()

  const [serviceId, setServiceId] = useState(prefillServiceId || '')
  const [date, setDate] = useState(prefillDate || '')
  const [timeSlot, setTimeSlot] = useState(prefillTime || '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [mode, setMode] = useState('video')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('confirmed')
  const [intakeNotes, setIntakeNotes] = useState('')

  const { data: slots } = useAvailableSlots(date, serviceId)
  const selectedService = services?.find((s) => s.id === serviceId)

  const { data: customers } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: async () => {
      if (!customerSearch || customerSearch.length < 2) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .or(`name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .limit(10)
      return data || []
    },
    enabled: customerSearch.length >= 2,
  })

  const availableModes = selectedService?.mode || ['video']

  const handleSubmit = async () => {
    if (!serviceId || !date || !timeSlot) {
      toast.error('Please select service, date and time')
      return
    }

    try {
      await createBooking.mutateAsync({
        booking_number: `BK-${Date.now()}`,
        customer_id: selectedCustomerId,
        service_id: serviceId,
        date,
        time_slot: timeSlot,
        status,
        mode,
        amount: Number(amount) || selectedService?.price || 0,
        payment_status: 'pending',
        intake_data: selectedCustomerId
          ? { notes: intakeNotes }
          : { name: customerSearch, notes: intakeNotes },
      })
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking')
    }
  }

  const resetForm = () => {
    setServiceId(prefillServiceId || '')
    setDate(prefillDate || '')
    setTimeSlot(prefillTime || '')
    setCustomerSearch('')
    setSelectedCustomerId(null)
    setMode('video')
    setAmount('')
    setStatus('confirmed')
    setIntakeNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Service */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Service *
            </Label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value)
                const svc = services?.find((s) => s.id === e.target.value)
                if (svc) {
                  setAmount(String(svc.price))
                  setMode(svc.mode?.[0] || 'video')
                }
                setTimeSlot('')
              }}
            >
              <option value="">Select a service</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Date *
            </Label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value)
                setTimeSlot('')
              }}
            />
          </div>

          {/* Time Slots */}
          {date && serviceId && slots && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Time Slot *
              </Label>
              {slots.length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">No slots available for this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTimeSlot(slot.time)}
                      className={`text-xs py-2 rounded-lg border transition-colors ${
                        timeSlot === slot.time
                          ? 'border-[#f59e0b] bg-amber-50 text-slate-900 font-medium'
                          : slot.available
                          ? 'border-slate-200 hover:border-slate-300 bg-white'
                          : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Customer
            </Label>
            {!selectedCustomerId ? (
              <>
                <Input
                  placeholder="Search by name, email or phone..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setSelectedCustomerId(null)
                  }}
                />
                {customers && customers.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {customers.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id)
                          setCustomerSearch(c.name || c.email)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium">{c.name || 'Unnamed'}</span>
                        <span className="text-slate-400 ml-2">{c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400">Leave empty for guest booking</p>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Badge variant="outline" className="text-xs">
                  {customerSearch}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(null)
                    setCustomerSearch('')
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <Label>Session Mode</Label>
            <div className="flex gap-2">
              {availableModes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    mode === m
                      ? 'border-[#f59e0b] bg-amber-50 text-slate-900 font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {m === 'video' && <Video className="h-3 w-3" />}
                  {m === 'phone' && <Phone className="h-3 w-3" />}
                  {m === 'chat' && <MessageCircle className="h-3 w-3" />}
                  {m === 'in_person' && <MapPin className="h-3 w-3" />}
                  {m.replace('_', '-')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(selectedService?.price || 0)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(['pending', 'confirmed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs border capitalize transition-colors ${
                    status === s
                      ? 'border-[#f59e0b] bg-amber-50 text-slate-900 font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Intake Notes</Label>
            <textarea
              value={intakeNotes}
              onChange={(e) => setIntakeNotes(e.target.value)}
              placeholder="Any notes about this booking..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
              onClick={handleSubmit}
              disabled={createBooking.isPending || !serviceId || !date || !timeSlot}
            >
              {createBooking.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Create Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
