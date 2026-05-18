import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const patchBookingSchema = z.object({
  updates: z.record(z.string(), z.unknown()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time_slot: z.string().optional(),
  service_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
}).passthrough()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor', 'support'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rawBody = await req.json()
    const parsed = patchBookingSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const body = parsed.data
    const updates = body.updates || body
    const service = getServiceClient('bookings-update')

    if (updates.date || updates.time_slot) {
      const { data: existingBooking, error: checkError } = await service
        .from('bookings')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError || !existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const { data: currentBooking } = await service
        .from('bookings')
        .select('service_id, date, time_slot')
        .eq('id', id)
        .single()

      const checkDate = updates.date || currentBooking?.date
      const checkTime = updates.time_slot || currentBooking?.time_slot
      const checkServiceId = updates.service_id || currentBooking?.service_id

      const { data: conflict, error: conflictError } = await service
        .from('bookings')
        .select('id')
        .eq('service_id', checkServiceId)
        .eq('date', checkDate)
        .eq('time_slot', checkTime)
        .not('status', 'in', '(cancelled,no_show)')
        .neq('id', id)
        .maybeSingle()

      if (conflictError) {
        return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
      }

      if (conflict) {
        return NextResponse.json(
          { error: 'This time slot is already booked. Please select a different time.' },
          { status: 409 }
        )
      }
    }

    const { data: booking, error } = await service
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, services(name, duration_minutes, color_code), profiles(name, email, phone)')
      .single()

    if (error) {
      console.error('Booking update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update booking' }, { status: 500 })
    }

    // Log audit trail
    await logAudit({
      userId: user.id,
      userEmail: user.email || '',
      action: 'UPDATE',
      tableName: 'bookings',
      recordId: id,
      newData: updates as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, booking })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Patch booking API error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
