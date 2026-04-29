'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useBooking, useUpdateBookingStatus } from '@/hooks/use-bookings'
import { useAvailableSlots } from '@/hooks/use-available-slots'
import { useCreateRemedy } from '@/hooks/use-remedies'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageCircle,
  User,
  FileText,
  ClipboardList,
  CheckCircle,
  X,
  Loader2,
  Plus,
  Copy,
  Check,
  StickyNote,
  Link as LinkIcon,
  AlertCircle,
  CalendarClock,
} from 'lucide-react'
import { toast } from 'sonner'

interface BookingDetailDrawerProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-slate-100 text-slate-800 border-slate-200',
}

const statusActions: Record<string, { label: string; next: string; icon: React.ReactNode; variant: 'default' | 'outline' | 'destructive' }[]> = {
  pending: [
    { label: 'Confirm Booking', next: 'confirmed', icon: <CheckCircle className='h-3.5 w-3.5' />, variant: 'default' },
    { label: 'Cancel', next: 'cancelled', icon: <X className='h-3.5 w-3.5' />, variant: 'destructive' },
  ],
  confirmed: [
    { label: 'Mark Completed', next: 'completed', icon: <CheckCircle className='h-3.5 w-3.5' />, variant: 'default' },
    { label: 'No Show', next: 'no_show', icon: <AlertCircle className='h-3.5 w-3.5' />, variant: 'destructive' },
  ],
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label || 'Copied'} to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }
  return (
    <button
      onClick={handleCopy}
      className='inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#f59e0b] transition-colors ml-1'
      title='Copy'
    >
      {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 text-slate-800'>
        {icon}
        <h3 className='font-semibold text-sm uppercase tracking-wide'>{title}</h3>
      </div>
      <div className='bg-slate-50 rounded-xl p-4 space-y-2'>
        {children}
      </div>
    </div>
  )
}

export function BookingDetailDrawer({ bookingId, open, onOpenChange }: BookingDetailDrawerProps) {
  const { data: booking, isPending } = useBooking(bookingId || '')
  const updateStatus = useUpdateBookingStatus()
  const createRemedy = useCreateRemedy()

  const [meetLink, setMeetLink] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [remedyOpen, setRemedyOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [remedyForm, setRemedyForm] = useState({
    title: '', description: '', duration_days: 21, frequency: 'Daily', instructions: '', attachment_url: '',
  })

  const { data: slots } = useAvailableSlots(rescheduleDate, booking?.service_id || '')

  const handleReschedule = () => {
    if (!booking || !rescheduleDate || !rescheduleTime) return
    updateStatus.mutate(
      {
        bookingId: booking.id,
        updates: { date: rescheduleDate, time_slot: rescheduleTime },
      },
      {
        onSuccess: () => {
          setRescheduleOpen(false)
          setRescheduleDate('')
          setRescheduleTime('')
        },
      }
    )
  }

  const actions = booking ? statusActions[booking.status] || [] : []

  const handleStatusChange = (status: string) => {
    if (!booking) return
    updateStatus.mutate({ bookingId: booking.id, updates: { status } })
  }

  const handleUpdate = (updates: Record<string, unknown>) => {
    if (!booking) return
    updateStatus.mutate({ bookingId: booking.id, updates })
  }

  const whatsappLink = booking?.profiles?.phone
    ? `https://wa.me/91${booking.profiles.phone.replace(/\D/g, '')}`
    : null

  const intakeData = booking?.intake_data as Record<string, unknown> || {}
  const hasIntakeData = Object.keys(intakeData).length > 0 && JSON.stringify(intakeData) !== '{}'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto p-0'>
        <SheetTitle className='sr-only'>Booking Details</SheetTitle>

        {isPending ? (
          <div className='h-full flex flex-col items-center justify-center gap-3 p-8'>
            <Loader2 className='h-8 w-8 animate-spin text-[#f59e0b]' />
            <p className='text-sm text-slate-500'>Loading booking details...</p>
          </div>
        ) : !booking ? (
          <div className='h-full flex flex-col items-center justify-center gap-3 p-8'>
            <Calendar className='h-10 w-10 text-slate-300' />
            <p className='text-sm text-slate-500'>Booking not found</p>
          </div>
        ) : (
          <div className='flex flex-col h-full'>
            {/* Header */}
            <SheetHeader className='px-6 py-5 border-b bg-slate-50/50'>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <SheetTitle className='text-lg flex items-center gap-2'>
                    Booking #{booking.booking_number}
                    <CopyButton text={booking.booking_number} label='Booking number' />
                  </SheetTitle>
                  <p className='text-xs text-slate-500'>
                    {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.time_slot}
                  </p>
                </div>
                <Badge className={`${statusColors[booking.status] || 'bg-slate-100'} border`}>
                  {booking.status}
                </Badge>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className='flex-1 px-6 py-5 space-y-6'>
              {/* Status Actions */}
              {actions.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {actions.map((action) => (
                    <Button
                      key={action.next}
                      size='sm'
                      variant={action.variant}
                      className='text-xs h-8 gap-1.5'
                      onClick={() => handleStatusChange(action.next)}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin' /> : action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Reschedule */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <Button
                  size='sm'
                  variant='outline'
                  className='text-xs h-8 gap-1.5'
                  onClick={() => {
                    setRescheduleDate(booking.date)
                    setRescheduleTime(booking.time_slot)
                    setRescheduleOpen(true)
                  }}
                >
                  <CalendarClock className='h-3.5 w-3.5' /> Reschedule
                </Button>
              )}

              {/* Service */}
              <Section title='Service' icon={<ClipboardList className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Service</span>
                  <span className='text-sm font-medium text-slate-900'>{booking.services?.name}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Duration</span>
                  <span className='text-sm text-slate-700'>{booking.services?.duration_minutes} mins</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Mode</span>
                  <span className='text-sm text-slate-700 capitalize flex items-center gap-1'>
                    {booking.mode === 'video' && <Video className='h-3.5 w-3.5' />}
                    {booking.mode === 'phone' && <Phone className='h-3.5 w-3.5' />}
                    {booking.mode}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Amount</span>
                  <span className='text-sm font-semibold text-slate-900'>₹{booking.amount}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Payment</span>
                  <Badge
                    className={
                      booking.payment_status === 'captured'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }
                  >
                    {booking.payment_status}
                  </Badge>
                </div>
              </Section>

              {/* Customer */}
              <Section title='Customer' icon={<User className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Name</span>
                  <span className='text-sm font-medium text-slate-900'>
                    {booking.profiles?.name || 'Guest'}
                  </span>
                </div>
                {booking.profiles?.email && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Email</span>
                    <span className='text-sm text-slate-900 flex items-center'>
                      {booking.profiles.email}
                      <CopyButton text={booking.profiles.email} />
                    </span>
                  </div>
                )}
                {booking.profiles?.phone && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Phone</span>
                    <span className='text-sm text-slate-900 flex items-center'>
                      {booking.profiles.phone}
                      <CopyButton text={booking.profiles.phone} />
                    </span>
                  </div>
                )}
              </Section>

              {/* Intake Data */}
              {hasIntakeData && (
                <Section title='Intake Notes' icon={<FileText className='h-4 w-4 text-[#f59e0b]' />}>
                  {Object.entries(intakeData).map(([key, value]) => (
                    <div key={key} className='text-sm'>
                      <span className='text-slate-500 capitalize'>{key.replace(/_/g, ' ')}:</span>{' '}
                      <span className='text-slate-800'>{String(value)}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Meet Link */}
              {booking.mode === 'video' && (
                <Section title='Meet Link' icon={<LinkIcon className='h-4 w-4 text-[#f59e0b]' />}>
                  <Input
                    value={meetLink || booking.meet_link || ''}
                    onChange={(e) => setMeetLink(e.target.value)}
                    placeholder='https://meet.google.com/...'
                    className='bg-white text-sm'
                  />
                  <div className='flex justify-end'>
                    <Button
                      size='sm'
                      onClick={() => handleUpdate({ meet_link: meetLink })}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin mr-1' /> : <LinkIcon className='h-3 w-3 mr-1' />}
                      Save Link
                    </Button>
                  </div>
                </Section>
              )}

              {/* Session Notes */}
              <Section title='Session Notes' icon={<StickyNote className='h-4 w-4 text-[#f59e0b]' />}>
                <Textarea
                  value={sessionNotes || booking.session_notes || ''}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder='Add post-session notes...'
                  className='bg-white text-sm'
                  rows={3}
                />
                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleUpdate({ session_notes: sessionNotes })}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin mr-1' /> : null}
                    Save Notes
                  </Button>
                </div>
              </Section>

              {/* Add Remedy */}
              {booking.status === 'completed' && (
                <div className='bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-emerald-800'>
                    <Plus className='h-5 w-5' />
                    <span className='text-sm font-medium'>Session completed. Add a remedy?</span>
                  </div>
                  <Button
                    size='sm'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={() => setRemedyOpen(true)}
                  >
                    <Plus className='h-3.5 w-3.5 mr-1' />
                    Add Remedy
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='px-6 py-4 border-t bg-slate-50/50 flex gap-2 flex-wrap'>
              {whatsappLink && (
                <Button size='sm' variant='outline' asChild>
                  <a href={whatsappLink} target='_blank' rel='noopener noreferrer'>
                    <MessageCircle className='h-4 w-4 mr-1.5' />
                    WhatsApp Customer
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>Reschedule Booking</DialogTitle></DialogHeader>
          <div className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label>New Date</Label>
              <Input
                type='date'
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setRescheduleDate(e.target.value)
                  setRescheduleTime('')
                }}
              />
            </div>
            {rescheduleDate && slots && (
              <div className='space-y-1.5'>
                <Label>New Time Slot</Label>
                {slots.length === 0 ? (
                  <p className='text-sm text-slate-500 bg-slate-50 rounded-lg p-3'>No slots available for this date.</p>
                ) : (
                  <div className='grid grid-cols-3 gap-2'>
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type='button'
                        disabled={!slot.available}
                        onClick={() => setRescheduleTime(slot.time)}
                        className={`text-xs py-2 rounded-lg border transition-colors ${
                          rescheduleTime === slot.time
                            ? 'border-[#f59e0b] bg-amber-50 text-slate-900 font-medium'
                            : slot.available
                            ? 'border-slate-200 hover:border-slate-300'
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
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='outline' size='sm' onClick={() => setRescheduleOpen(false)}>Cancel</Button>
              <Button
                size='sm'
                className='bg-[#f59e0b] text-slate-900'
                disabled={updateStatus.isPending || !rescheduleDate || !rescheduleTime}
                onClick={handleReschedule}
              >
                {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin mr-1' /> : null}
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Remedy Dialog */}
      <Dialog open={remedyOpen} onOpenChange={setRemedyOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>Add Remedy</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'><Label>Title *</Label><Input value={remedyForm.title} onChange={(e) => setRemedyForm({ ...remedyForm, title: e.target.value })} placeholder='e.g. Hanuman Chalisa' /></div>
            <div className='space-y-1'><Label>Description</Label><Textarea value={remedyForm.description} onChange={(e) => setRemedyForm({ ...remedyForm, description: e.target.value })} /></div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'><Label>Duration (days)</Label><Input type='number' value={remedyForm.duration_days} onChange={(e) => setRemedyForm({ ...remedyForm, duration_days: Number(e.target.value) })} /></div>
              <div className='space-y-1'><Label>Frequency</Label>
                <select className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={remedyForm.frequency} onChange={(e) => setRemedyForm({ ...remedyForm, frequency: e.target.value })}>
                  <option>Daily</option><option>Twice a day</option><option>Specific days</option>
                </select>
              </div>
            </div>
            <div className='space-y-1'><Label>Instructions</Label><Textarea value={remedyForm.instructions} onChange={(e) => setRemedyForm({ ...remedyForm, instructions: e.target.value })} placeholder='Step by step instructions...' /></div>
            <div className='space-y-1'><Label>Attachment URL</Label><Input value={remedyForm.attachment_url} onChange={(e) => setRemedyForm({ ...remedyForm, attachment_url: e.target.value })} placeholder='https://...' /></div>
            <Button
              className='w-full bg-[#f59e0b] text-slate-900'
              onClick={() => {
                if (!remedyForm.title || !booking) return
                createRemedy.mutate({
                  ...remedyForm,
                  customer_id: booking.customer_id,
                  booking_id: booking.id,
                  status: 'active',
                }, { onSuccess: () => { setRemedyOpen(false); setRemedyForm({ title: '', description: '', duration_days: 21, frequency: 'Daily', instructions: '', attachment_url: '' }) } })
              }}
            >
              Save Remedy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
