import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const createBookingSchema = z.object({
  booking_number: z.string().optional(),
  customer_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time_slot: z.string().min(1, 'Time slot is required'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  mode: z.enum(['video', 'audio', 'in_person']).optional(),
  intake_data: z.record(z.string(), z.unknown()).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  amount: z.number().min(0).optional(),
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsed = createBookingSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      booking_number,
      customer_id,
      service_id,
      date,
      time_slot,
      status,
      mode,
      intake_data,
      payment_status,
      amount,
    } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== customer_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'editor', 'support'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const service = getServiceClient('bookings-create')

    const { data: existingBooking, error: checkError } = await service
      .from('bookings')
      .select('id')
      .eq('service_id', service_id)
      .eq('date', date)
      .eq('time_slot', time_slot)
      .not('status', 'in', '(cancelled,no_show)')
      .maybeSingle()

    if (checkError) {
      console.error('Booking conflict check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check booking availability' },
        { status: 500 }
      )
    }

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please select a different time.' },
        { status: 409 }
      )
    }

    const { data: booking, error } = await service
      .from('bookings')
      .insert({
        booking_number,
        customer_id,
        service_id,
        date,
        time_slot,
        status: status || 'confirmed',
        mode: mode || 'video',
        intake_data: intake_data || {},
        payment_status: payment_status || 'pending',
        amount,
      })
      .select('*, services(name, duration_minutes, color_code), profiles(name, email, phone)')
      .single()

    if (error) {
      console.error('Booking creation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Log audit trail
    await logAudit({
      userId: user.id,
      userEmail: user.email || '',
      action: 'CREATE',
      tableName: 'bookings',
      recordId: booking.id,
      newData: booking as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, booking })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Create booking API error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
