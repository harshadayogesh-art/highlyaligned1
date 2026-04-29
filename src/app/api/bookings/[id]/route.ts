import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()
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

    const body = await req.json()
    const updates = body.updates || body

    // ── Conflict check on reschedule ──
    if (updates.date || updates.time_slot) {
      const { data: existingBooking, error: checkError } = await supabaseService
        .from('bookings')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError || !existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Fetch the current booking to get service_id if not in updates
      const { data: currentBooking } = await supabaseService
        .from('bookings')
        .select('service_id, date, time_slot')
        .eq('id', id)
        .single()

      const checkDate = updates.date || currentBooking?.date
      const checkTime = updates.time_slot || currentBooking?.time_slot
      const checkServiceId = updates.service_id || currentBooking?.service_id

      const { data: conflict, error: conflictError } = await supabaseService
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

    const { data: booking, error } = await supabaseService
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, services(name, duration_minutes, color_code), profiles(name, email, phone)')
      .single()

    if (error) {
      console.error('Booking update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking })
  } catch (err) {
    console.error('Patch booking API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
