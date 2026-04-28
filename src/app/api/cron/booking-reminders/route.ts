import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp, sendSMS } from '@/lib/notifications'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const oneHour = new Date(now)
  oneHour.setHours(oneHour.getHours() + 1)
  const oneHourStr = oneHour.toISOString().split('T')[0]

  // Find bookings in next 24 hours
  const { data: bookings24h } = await supabase
    .from('bookings')
    .select('*, services(name), profiles(name, phone)')
    .eq('date', tomorrowStr)
    .eq('status', 'confirmed')

  // Find bookings in next 1 hour
  const { data: bookings1h } = await supabase
    .from('bookings')
    .select('*, services(name), profiles(name, phone)')
    .eq('date', oneHourStr)
    .eq('status', 'confirmed')

  for (const b of bookings24h || []) {
    if (b.profiles?.phone) {
      await sendWhatsApp(b.profiles.phone, 'booking_reminder', {
        name: b.profiles.name || 'Customer',
        service: b.services?.name || 'Session',
        date: b.date,
        time: b.time_slot,
        meet_link: b.meet_link || 'Will be shared shortly',
      })
    }
  }

  for (const b of bookings1h || []) {
    if (b.profiles?.phone) {
      await sendSMS(b.profiles.phone, `Reminder: Your ${b.services?.name} is today at ${b.time_slot}. Join: ${b.meet_link || 'Link will be shared shortly'}`)
    }
  }

  return Response.json({ sent24h: bookings24h?.length || 0, sent1h: bookings1h?.length || 0 })
}
