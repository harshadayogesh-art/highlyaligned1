'use server'

import { sendWhatsApp, sendEmail } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'

export async function triggerOrderNotification(orderId: string, event: 'placed' | 'accepted' | 'shipped' | 'delivered' | 'payment_captured') {
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
        3: event === 'placed' ? 'placed successfully' : event === 'payment_captured' ? 'payment received' : event,
      }).catch(console.error)
    }

    if (email) {
      const brandColor = '#5e35b1'
      const baseStyles = 'font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'
      
      if (event === 'placed') {
        const paymentInfo = order.payment_mode === 'online' ? 'Your payment has been successfully captured.' : 'Payment Mode: Cash on Delivery (COD)'
        await sendEmail(
          email,
          `Order Confirmation - ${order.order_number}`,
          `
          <div style="${baseStyles}">
            <h2 style="color: ${brandColor};">Order Placed Successfully</h2>
            <p>Dear ${name},</p>
            <p>Thank you for your order! We are processing it and will ship it soon.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.final_total}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${paymentInfo}</p>
            </div>
            <p>You will receive another update when your order is delivered.</p>
            <p>Thanks,<br/>Selfaligned Team</p>
          </div>
          `
        ).catch(console.error)
      } else if (event === 'delivered') {
        await sendEmail(
          email,
          `Your Order ${order.order_number} has been Delivered!`,
          `
          <div style="${baseStyles}">
            <h2 style="color: #10b981;">Order Delivered</h2>
            <p>Dear ${name},</p>
            <p>Great news! Your order <strong>${order.order_number}</strong> has been successfully delivered.</p>
            <p>We hope you love your purchase. If you have any questions, feel free to contact our support.</p>
            <p>Thanks,<br/>Selfaligned Team</p>
          </div>
          `
        ).catch(console.error)
      } else if (event === 'payment_captured') {
        await sendEmail(
          email,
          `Payment Received - Order ${order.order_number}`,
          `
          <div style="${baseStyles}">
            <h2 style="color: ${brandColor};">Payment Successful</h2>
            <p>Dear ${name},</p>
            <p>We have successfully received the payment of <strong>₹${order.final_total}</strong> for your order <strong>${order.order_number}</strong>.</p>
            <p>Thank you for shopping with us!</p>
            <p>Thanks,<br/>Selfaligned Team</p>
          </div>
          `
        ).catch(console.error)
      }
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
