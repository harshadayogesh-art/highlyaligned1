'use server'

import { sendWhatsApp, sendEmail } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'

export async function triggerOrderNotification(orderId: string, event: 'placed' | 'accepted' | 'shipped' | 'delivered') {
  try {
    const supabase = await createClient()
    const { data: order } = await supabase
      .from('orders')
      .select('*, profiles(*)')
      .eq('id', orderId)
      .single()

    if (!order) return

    const phone = order.profiles?.phone || (order.shipping_address as any)?.phone
    const name = order.profiles?.full_name || (order.shipping_address as any)?.name || 'Customer'
    const email = order.profiles?.email || (order.shipping_address as any)?.email

    // Check settings if notifications are enabled
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'notifications_config').single()
    const config = settings?.value as Record<string, boolean> | null
    if (config && config.order_updates === false) return

    if (phone) {
      await sendWhatsApp(phone, 'order_update', {
        1: name,
        2: order.order_number,
        3: event === 'placed' ? 'placed successfully' : event,
      }).catch(console.error)
    }

    if (email && event === 'placed') {
      await sendEmail(
        email,
        `Order Confirmation - ${order.order_number}`,
        `<p>Dear ${name},</p><p>Your order <strong>${order.order_number}</strong> has been placed successfully.</p><p>Total: Rs.${order.final_total}</p>`
      ).catch(console.error)
    }
  } catch (error) {
    console.error('Failed to trigger order notification', error)
  }
}

export async function triggerBookingNotification(bookingId: string) {
  try {
    const supabase = await createClient()
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, profiles(*), services(*)')
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const phone = booking.profiles?.phone || (booking.intake_form as any)?.phone
    const name = booking.profiles?.full_name || (booking.intake_form as any)?.name || 'Customer'
    const email = booking.profiles?.email || (booking.intake_form as any)?.email

    // Check settings if notifications are enabled
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'notifications_config').single()
    const config = settings?.value as Record<string, boolean> | null
    if (config && config.booking_confirmation === false) return

    if (phone) {
      await sendWhatsApp(phone, 'booking_confirmed', {
        1: name,
        2: booking.services?.name || 'Consultation',
        3: new Date(booking.booking_date).toLocaleDateString(),
        4: booking.booking_time,
        5: booking.meet_link || 'Link will be sent soon',
      }).catch(console.error)
    }

    if (email) {
      await sendEmail(
        email,
        `Booking Confirmed - ${booking.services?.name || 'Consultation'}`,
        `<p>Dear ${name},</p><p>Your booking for <strong>${booking.services?.name || 'Consultation'}</strong> is confirmed.</p><p>Date: ${new Date(booking.booking_date).toLocaleDateString()}<br>Time: ${booking.booking_time}</p><p>Meet Link: ${booking.meet_link || 'To be updated'}</p>`
      ).catch(console.error)
    }
  } catch (error) {
    console.error('Failed to trigger booking notification', error)
  }
}
