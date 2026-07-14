// WhatsApp Bot Engine
// Drives the lead qualification conversation via admin-designed flows

import { createClient } from '@supabase/supabase-js'
import { sendTextMessage, sendButtonMessage, sendListMessage, markMessageRead } from './client'
import type {
  WhatsAppContact,
  WhatsAppConversation,
  WhatsAppFlow,
  FlowStep,
  MetaMessage,
} from '@/types/whatsapp'

// Use service role for bot operations (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// STOP keywords - GDPR/TRAI compliant
const STOP_KEYWORDS = ['stop', 'unsubscribe', 'cancel', 'quit', 'no more', 'remove me', 'opt out', 'optout']
const HUMAN_TAKEOVER_KEYWORDS = ['agent', 'human', 'talk to someone', 'real person', 'support']

// -------------------------------------------------------
// Main entry: process an incoming WhatsApp message
// -------------------------------------------------------
export async function processIncomingMessage(
  from: string,        // customer phone
  waId: string,        // WhatsApp contact ID
  name: string,        // display name from WhatsApp
  message: MetaMessage
) {
  const supabase = getServiceClient()
  const text = extractMessageText(message).trim()
  const lowerText = text.toLowerCase()

  console.log(`[Bot] Message from ${from}: "${text}"`)

  // 1. Check opt-out list FIRST
  const { data: optOut } = await supabase
    .from('whatsapp_opt_outs')
    .select('id')
    .eq('phone', from)
    .maybeSingle()

  if (optOut) {
    console.log(`[Bot] ${from} is opted out. Ignoring message.`)
    return
  }

  // 2. Handle STOP keyword
  if (STOP_KEYWORDS.some((kw) => lowerText.includes(kw))) {
    await handleOptOut(from, waId, text)
    return
  }

  // 3. Mark message as read
  if (message.id) {
    await markMessageRead(message.id).catch(() => {})
  }

  // 4. Get or create contact
  const contact = await upsertContact(from, waId, name)

  // 5. Get or create conversation
  const conversation = await getOrCreateConversation(contact)

  // 6. Save inbound message to DB
  await saveMessage(conversation.id, message.id, 'inbound', text)

  // 7. Handle human takeover request
  if (HUMAN_TAKEOVER_KEYWORDS.some((kw) => lowerText.includes(kw))) {
    await switchToHumanMode(conversation, contact)
    return
  }

  // 8. Route based on conversation mode
  if (conversation.mode === 'human') {
    // Admin is handling — just save message, notify via Supabase Realtime
    console.log(`[Bot] Conversation ${conversation.id} in human mode. Skipping bot response.`)
    return
  }

  if (conversation.mode === 'closed') {
    // Re-open conversation
    await supabase
      .from('whatsapp_conversations')
      .update({ mode: 'bot', status: 'open' })
      .eq('id', conversation.id)
  }

  // 9. Run bot flow
  await runBotFlow(contact, conversation, text, message)
}

// -------------------------------------------------------
// Flow Engine
// -------------------------------------------------------
async function runBotFlow(
  contact: WhatsAppContact,
  conversation: WhatsAppConversation,
  text: string,
  message: MetaMessage
) {
  const supabase = getServiceClient()

  // Load active flow if not set
  let flow: WhatsAppFlow | null = null
  if (conversation.flow_id) {
    const { data } = await supabase
      .from('whatsapp_flows')
      .select('*')
      .eq('id', conversation.flow_id)
      .single()
    flow = data
  } else {
    // Find a flow matching trigger keywords or default active flow
    const { data: flows } = await supabase
      .from('whatsapp_flows')
      .select('*')
      .eq('is_active', true)
      .limit(5)
    
    if (flows && flows.length > 0) {
      flow = flows.find(f =>
        f.trigger_keywords.some((kw: string) => text.toLowerCase().includes(kw))
      ) || flows[0]
    }
  }

  if (!flow || !flow.steps || flow.steps.length === 0) {
    // No flow — send default greeting
    await sendTextMessage(
      contact.phone,
      `Hi ${contact.name || 'there'} 🙏 Thanks for reaching out to *Selfaligned*! We'd love to help you. How can we assist you today?`
    )
    return
  }

  // First message (no current step) — start the flow
  if (!conversation.current_step_id) {
    // Send greeting template then start flow
    await sendTextMessage(
      contact.phone,
      `Hi ${contact.name || 'there'} 🙏 Thanks for reaching out to *Selfaligned*! We're so excited to connect with you.\n\nI'll ask you a few quick questions to find the best solution for you — it takes less than 2 minutes! 🌟`
    )
    
    // Assign flow and start with step 1
    await supabase
      .from('whatsapp_conversations')
      .update({
        flow_id: flow.id,
        current_step_id: flow.steps[0].id,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    await sendStep(contact.phone, flow.steps[0])
    return
  }

  // Find current step
  const currentStep = flow.steps.find((s) => s.id === conversation.current_step_id)
  if (!currentStep) {
    console.error(`[Bot] Step ${conversation.current_step_id} not found in flow`)
    return
  }

  // Collect answer and score
  const answer = extractAnswer(text, message, currentStep)
  const scoreGain = calculateScore(answer, currentStep)

  // Save answer
  const updatedAnswers = { ...(conversation.answers || {}), [currentStep.field]: answer }
  const newScore = (conversation.lead_score || 0) + scoreGain

  // Move to next step or complete
  if (currentStep.next_step === 'complete') {
    await completeFlow(contact, conversation, updatedAnswers, newScore, flow)
  } else {
    const nextStep = flow.steps.find((s) => s.id === currentStep.next_step)
    if (!nextStep) {
      await completeFlow(contact, conversation, updatedAnswers, newScore, flow)
      return
    }

    // Update conversation
    await supabase
      .from('whatsapp_conversations')
      .update({
        current_step_id: nextStep.id,
        answers: updatedAnswers,
        lead_score: newScore,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    await supabase
      .from('whatsapp_contacts')
      .update({ lead_score: newScore })
      .eq('id', contact.id)

    // Send next question
    await sendStep(contact.phone, nextStep)
  }
}

// -------------------------------------------------------
// Complete the qualification flow
// -------------------------------------------------------
async function completeFlow(
  contact: WhatsAppContact,
  conversation: WhatsAppConversation,
  answers: Record<string, string | number>,
  finalScore: number,
  flow: WhatsAppFlow
) {
  const supabase = getServiceClient()
  
  const isQualified = finalScore >= 15 // configurable threshold

  // Update contact name if collected
  if (answers.name && typeof answers.name === 'string') {
    await supabase
      .from('whatsapp_contacts')
      .update({ name: answers.name, status: isQualified ? 'qualified' : 'engaged', lead_score: finalScore })
      .eq('id', contact.id)
  }

  // Create appointment record if qualified
  if (isQualified) {
    const { data: appointment } = await supabase
      .from('whatsapp_appointments')
      .insert({
        contact_id: contact.id,
        conversation_id: conversation.id,
        service_name: answers.interest as string || null,
        preferred_date: answers.preferred_date as string || null,
        preferred_time: answers.preferred_time as string || null,
        status: 'pending',
      })
      .select()
      .single()

    // Schedule follow-up sequence
    if (appointment) {
      await scheduleFollowUps(contact, conversation.id, appointment.id)
    }

    await supabase
      .from('whatsapp_conversations')
      .update({
        status: 'qualified',
        mode: 'human', // Hand off to admin
        answers,
        lead_score: finalScore,
        current_step_id: null,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    // Confirmation message
    await sendTextMessage(
      contact.phone,
      `🌟 Thank you ${answers.name || 'for sharing'}!\n\nBased on what you've told us, we believe we can truly help you. Our team will review your details and confirm your appointment shortly.\n\n📅 *Preferred date:* ${answers.preferred_date || 'TBD'}\n⏰ *Preferred time:* ${answers.preferred_time || 'TBD'}\n\nWe'll be in touch within a few hours. In the meantime, if you have any questions just reply here! 🙏`
    )
  } else {
    await supabase
      .from('whatsapp_conversations')
      .update({
        status: 'unqualified',
        answers,
        lead_score: finalScore,
        current_step_id: null,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    await sendTextMessage(
      contact.phone,
      `Thank you for getting in touch with us! 🙏 We've noted your interest and our team will reach out to you with options that best suit your needs. Have a wonderful day! ✨`
    )
  }
}

// -------------------------------------------------------
// Schedule follow-up messages
// -------------------------------------------------------
async function scheduleFollowUps(
  contact: WhatsAppContact,
  conversationId: string,
  appointmentId: string
) {
  const supabase = getServiceClient()
  const name = contact.name || 'there'
  const now = new Date()

  const followUps = [
    {
      template_name: 'followup_1h',
      message_body: `Hi ${name} 👋 We noticed you haven't confirmed your appointment yet. We'd love to help you — your slot is still available! Would you like to confirm? Reply *YES* to confirm or *NO* to cancel.`,
      scheduled_at: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      attempt: 1,
    },
    {
      template_name: 'followup_24h',
      message_body: `Hi ${name}, just a gentle reminder 🌟 Your appointment with Selfaligned is still pending confirmation. Slots fill up fast — shall we lock it in for you? Reply *CONFIRM* or *CANCEL*.`,
      scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      attempt: 2,
    },
    {
      template_name: 'followup_48h',
      message_body: `Hi ${name}, this is our final reminder about your pending appointment with Selfaligned. If you're no longer interested, just reply *STOP* and we'll remove you from our list. Otherwise, reply *YES* to confirm! 🙏`,
      scheduled_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      attempt: 3,
    },
  ]

  await supabase.from('whatsapp_followup_queue').insert(
    followUps.map((f) => ({
      ...f,
      contact_id: contact.id,
      conversation_id: conversationId,
      appointment_id: appointmentId,
      status: 'pending',
    }))
  )
}

// -------------------------------------------------------
// Opt-out handler
// -------------------------------------------------------
async function handleOptOut(from: string, waId: string, triggerWord: string) {
  const supabase = getServiceClient()

  // Get contact if exists
  const { data: contact } = await supabase
    .from('whatsapp_contacts')
    .select('id')
    .eq('phone', from)
    .maybeSingle()

  // Insert opt-out record
  await supabase
    .from('whatsapp_opt_outs')
    .upsert({ phone: from, contact_id: contact?.id || null, trigger_word: triggerWord })

  // Update contact
  if (contact) {
    await supabase
      .from('whatsapp_contacts')
      .update({ opted_out: true, opted_out_at: new Date().toISOString() })
      .eq('id', contact.id)
  }

  // Cancel all pending follow-ups
  if (contact) {
    await supabase
      .from('whatsapp_followup_queue')
      .update({ status: 'cancelled' })
      .eq('contact_id', contact.id)
      .eq('status', 'pending')
  }

  // Send acknowledgment (this is the ONLY message allowed after STOP)
  await sendTextMessage(
    from,
    `We've received your STOP request and have removed you from our messaging list. You won't receive any more messages from us. To opt back in anytime, just message us. 🙏`
  )

  console.log(`[Bot] Opted out: ${from}`)
}

// -------------------------------------------------------
// Switch to human mode
// -------------------------------------------------------
async function switchToHumanMode(conversation: WhatsAppConversation, contact: WhatsAppContact) {
  const supabase = getServiceClient()

  await supabase
    .from('whatsapp_conversations')
    .update({ mode: 'human', last_message_at: new Date().toISOString() })
    .eq('id', conversation.id)

  await sendTextMessage(
    contact.phone,
    `Of course! 😊 I'm connecting you with one of our team members right now. Please hold on for a moment — they'll be with you shortly!`
  )
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
async function upsertContact(phone: string, waId: string, name: string): Promise<WhatsAppContact> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .upsert(
      { phone, wa_id: waId, name: name || null },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

async function getOrCreateConversation(contact: WhatsAppContact): Promise<WhatsAppConversation> {
  const supabase = getServiceClient()

  // Find open conversation
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('contact_id', contact.id)
    .in('status', ['open', 'qualified'])
    .neq('mode', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing

  // Create new conversation
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      contact_id: contact.id,
      mode: 'bot',
      status: 'open',
      answers: {},
      lead_score: 0,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function saveMessage(
  conversationId: string,
  waMessageId: string | null,
  direction: 'inbound' | 'outbound',
  content: string,
  type: string = 'text'
) {
  const supabase = getServiceClient()
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    wa_message_id: waMessageId,
    direction,
    type,
    content,
    status: direction === 'outbound' ? 'sent' : 'read',
  })

  // Update last_message_at
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
}

async function sendStep(phone: string, step: FlowStep) {
  if (step.type === 'button' && step.options && step.options.length <= 3) {
    await sendButtonMessage(
      phone,
      step.question,
      step.options.map((opt, i) => ({ id: `step_${i}`, title: opt }))
    )
  } else if (step.type === 'button' && step.options && step.options.length > 3) {
    await sendListMessage(
      phone,
      step.question,
      'Choose an option',
      [{ title: 'Options', rows: step.options.map((opt, i) => ({ id: `opt_${i}`, title: opt })) }]
    )
  } else {
    await sendTextMessage(phone, step.question)
  }
}

function extractMessageText(message: MetaMessage): string {
  if (message.text?.body) return message.text.body
  if (message.button?.text) return message.button.text
  if (message.interactive?.button_reply?.title) return message.interactive.button_reply.title
  if (message.interactive?.list_reply?.title) return message.interactive.list_reply.title
  return ''
}

function extractAnswer(text: string, message: MetaMessage, step: FlowStep): string {
  // For button replies use the title directly
  if (message.interactive?.button_reply?.title) return message.interactive.button_reply.title
  if (message.interactive?.list_reply?.title) return message.interactive.list_reply.title
  if (message.button?.text) return message.button.text
  return text
}

function calculateScore(answer: string, step: FlowStep): number {
  if (step.score_map && step.score_map[answer] !== undefined) {
    return step.score_map[answer]
  }
  if (step.type === 'number') {
    const num = parseInt(answer, 10)
    if (!isNaN(num)) {
      return num * (step.score_multiplier || 1)
    }
  }
  return answer ? 5 : 0 // default: 5 points for any answer
}
