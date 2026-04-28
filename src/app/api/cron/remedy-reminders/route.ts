import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/notifications'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: remedies } = await supabase
    .from('remedies')
    .select('*, profiles(name, phone), remedy_logs!inner(log_date, status)')
    .eq('status', 'active')

  const pendingRemedies = (remedies || []).filter((r) => {
    const todayLog = r.remedy_logs?.find((l: { log_date: string }) => l.log_date === today)
    return !todayLog || todayLog.status !== 'done'
  })

  for (const r of pendingRemedies) {
    if (r.profiles?.phone) {
      const doneCount = r.remedy_logs?.filter((l: { status: string }) => l.status === 'done').length || 0
      await sendWhatsApp(r.profiles.phone, 'remedy_reminder', {
        name: r.profiles.name || 'Customer',
        remedy: r.title,
        day: String(doneCount + 1),
        total: String(r.duration_days || 21),
      })
    }
  }

  return Response.json({ sent: pendingRemedies.length })
}
