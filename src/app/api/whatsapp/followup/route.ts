import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/client'

// This route is called by a CRON job every hour
// It processes pending follow-up messages

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()
  
  // Get pending follow-ups that are due
  const { data: dueFollowUps, error } = await supabase
    .from('whatsapp_followup_queue')
    .select('*, contact:whatsapp_contacts(*), appointment:whatsapp_appointments(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(50) // Process max 50 per run

  if (error) {
    console.error('[Followup Cron] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const item of dueFollowUps || []) {
    try {
      const contact = item.contact

      // Skip if opted out
      if (contact.opted_out) {
        await supabase
          .from('whatsapp_followup_queue')
          .update({ status: 'skipped' })
          .eq('id', item.id)
        skipped++
        continue
      }

      // Check opt-out table
      const { data: optOut } = await supabase
        .from('whatsapp_opt_outs')
        .select('id')
        .eq('phone', contact.phone)
        .maybeSingle()

      if (optOut) {
        await supabase
          .from('whatsapp_followup_queue')
          .update({ status: 'skipped' })
          .eq('id', item.id)
        skipped++
        continue
      }

      // Check if appointment is already confirmed (no need to follow up)
      if (item.appointment && item.appointment.status === 'confirmed') {
        await supabase
          .from('whatsapp_followup_queue')
          .update({ status: 'cancelled' })
          .eq('id', item.id)
        skipped++
        continue
      }

      // Send the follow-up message
      await sendTextMessage(contact.phone, item.message_body)

      // Mark as sent
      await supabase
        .from('whatsapp_followup_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', item.id)

      // Save outbound message to conversation
      if (item.conversation_id) {
        await supabase.from('whatsapp_messages').insert({
          conversation_id: item.conversation_id,
          direction: 'outbound',
          type: 'text',
          content: item.message_body,
          status: 'sent',
        })
      }

      sent++
      console.log(`[Followup] Sent to ${contact.phone} (attempt ${item.attempt})`)
    } catch (err) {
      console.error(`[Followup] Failed for ${item.id}:`, err)
      // Don't mark as failed — will retry next run if still pending
    }
  }

  return NextResponse.json({
    success: true,
    processed: (dueFollowUps || []).length,
    sent,
    skipped,
  })
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}
