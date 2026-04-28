import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
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
    } = body

    if (!customer_id || !service_id || !date || !time_slot) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only create bookings for themselves (unless admin)
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

    const { data: booking, error } = await supabaseService
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

    return NextResponse.json({ success: true, booking })
  } catch (err) {
    console.error('Create booking API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
