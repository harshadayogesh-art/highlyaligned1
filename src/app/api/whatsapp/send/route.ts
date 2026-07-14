import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp/client'

// Send a message FROM admin TO customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { conversationId, message, type = 'text' } = body

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Missing conversationId or message' }, { status: 400 })
    }

    // Get conversation + contact
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: conversation } = await serviceClient
      .from('whatsapp_conversations')
      .select('*, contact:whatsapp_contacts(*)')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const phone = conversation.contact.phone

    // Check opt-out
    const { data: optOut } = await serviceClient
      .from('whatsapp_opt_outs')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (optOut) {
      return NextResponse.json({ error: 'Contact has opted out' }, { status: 400 })
    }

    // Send via Meta API
    await sendTextMessage(phone, message)

    // Save outbound message to DB
    const { data: savedMsg } = await serviceClient
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        type,
        content: message,
        status: 'sent',
      })
      .select()
      .single()

    // Update conversation last_message_at and mode to human
    await serviceClient
      .from('whatsapp_conversations')
      .update({
        mode: 'human',
        last_message_at: new Date().toISOString(),
        assigned_to: user.id,
      })
      .eq('id', conversationId)

    return NextResponse.json({ success: true, message: savedMsg })
  } catch (err) {
    console.error('[Send Message]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
