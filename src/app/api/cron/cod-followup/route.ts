import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp, sendSMS } from '@/lib/notifications'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(name, phone)')
    .eq('status', 'delivered')
    .eq('payment_mode', 'cod')
    .eq('cod_collected', false)
    .lt('updated_at', threeDaysAgo.toISOString())

  for (const o of orders || []) {
    if (o.profiles?.phone) {
      await sendWhatsApp(o.profiles.phone, 'order_update', {
        name: o.profiles.name || 'Customer',
        order_number: o.order_number,
        status: 'Pending COD payment',
        track_link: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
      })
      await sendSMS(
        o.profiles.phone,
        `Hi ${o.profiles.name}, please pay Rs.${o.final_total} for order ${o.order_number}. Our delivery partner will collect it. - HighlyAligned`
      )
    }
  }

  return Response.json({ sent: orders?.length || 0 })
}
