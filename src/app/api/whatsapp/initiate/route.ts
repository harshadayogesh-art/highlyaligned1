import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/client'

// Admin initiates a new conversation to any phone number
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { phone, name, message } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 })
    }

    // Normalize phone: remove spaces, dashes, +
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check opt-out
    const { data: optOut } = await serviceClient
      .from('whatsapp_opt_outs')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (optOut) {
      return NextResponse.json({ error: 'This number has opted out (STOP)' }, { status: 400 })
    }

    // Upsert contact
    const { data: contact } = await serviceClient
      .from('whatsapp_contacts')
      .upsert(
        { phone: normalizedPhone, name: name || null, source: 'admin_initiated' },
        { onConflict: 'phone' }
      )
      .select()
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    // Create conversation
    const { data: conversation } = await serviceClient
      .from('whatsapp_conversations')
      .insert({
        contact_id: contact.id,
        mode: 'human',
        status: 'open',
        answers: {},
        lead_score: 0,
        assigned_to: user.id,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Send via WhatsApp API
    await sendTextMessage(normalizedPhone, message)

    // Save to messages
    await serviceClient.from('whatsapp_messages').insert({
      conversation_id: conversation.id,
      direction: 'outbound',
      type: 'text',
      content: message,
      status: 'sent',
    })

    return NextResponse.json({ success: true, conversationId: conversation.id, contact })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to initiate conversation'
    console.error('[Initiate]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
