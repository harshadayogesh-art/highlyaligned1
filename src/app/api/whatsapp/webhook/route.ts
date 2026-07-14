import { NextRequest, NextResponse } from 'next/server'
import { processIncomingMessage } from '@/lib/whatsapp/bot-engine'
import { createClient } from '@supabase/supabase-js'
import type { MetaWebhookPayload, MetaMessage } from '@/types/whatsapp'

// -------------------------------------------------------
// GET — WhatsApp webhook verification (Meta requires this)
// -------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// -------------------------------------------------------
// POST — Receive incoming WhatsApp messages
// -------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body: MetaWebhookPayload = await request.json()

    // Meta sends test pings — ignore non-whatsapp objects
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue

        const value = change.value
        const messages = value.messages || []
        const statuses = value.statuses || []
        const contacts = value.contacts || []

        // Handle status updates (delivered, read, failed)
        for (const status of statuses) {
          await handleStatusUpdate(status.id, status.status)
        }

        // Handle incoming messages
        for (const message of messages) {
          const contact = contacts.find((c) => c.wa_id === message.from)
          const name = contact?.profile?.name || ''
          
          // Process asynchronously — don't block the 200 response
          processIncomingMessage(message.from, message.from, name, message).catch((err) => {
            console.error('[Webhook] Bot error:', err)
          })
        }
      }
    }

    // Always respond 200 quickly — Meta will retry if you don't
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ status: 'error' }, { status: 200 }) // Still 200 to stop Meta retries
  }
}

// -------------------------------------------------------
// Update message delivery status in DB
// -------------------------------------------------------
async function handleStatusUpdate(waMessageId: string, status: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('wa_message_id', waMessageId)
  } catch (err) {
    console.error('[Webhook] Status update error:', err)
  }
}
