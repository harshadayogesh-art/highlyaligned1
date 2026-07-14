// WhatsApp CRM TypeScript Types

export type WaContactStatus = 'new' | 'engaged' | 'qualified' | 'booked' | 'churned'
export type ConversationMode = 'bot' | 'human' | 'closed'
export type ConversationStatus = 'open' | 'qualified' | 'unqualified' | 'booked' | 'closed'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'template' | 'button' | 'image' | 'audio' | 'document' | 'interactive'
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show'
export type FollowupStatus = 'pending' | 'sent' | 'cancelled' | 'skipped'

// ---- DB Models ----

export interface WhatsAppContact {
  id: string
  phone: string
  name: string | null
  wa_id: string | null
  status: WaContactStatus
  lead_score: number
  opted_out: boolean
  opted_out_at: string | null
  source: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FlowStep {
  id: string
  question: string
  type: 'text' | 'button' | 'number' | 'date'
  field: string
  options?: string[]
  score_map?: Record<string, number>
  score_multiplier?: number
  next_step: string // step_id or "complete"
}

export interface WhatsAppFlow {
  id: string
  name: string
  description: string | null
  steps: FlowStep[]
  is_active: boolean
  trigger_keywords: string[]
  created_at: string
  updated_at: string
}

export interface WhatsAppConversation {
  id: string
  contact_id: string
  flow_id: string | null
  current_step_id: string | null
  mode: ConversationMode
  status: ConversationStatus
  answers: Record<string, string | number>
  lead_score: number
  assigned_to: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  // Joined
  contact?: WhatsAppContact
  messages?: WhatsAppMessage[]
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  wa_message_id: string | null
  direction: MessageDirection
  type: MessageType
  content: string
  metadata: Record<string, unknown>
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
}

export interface WhatsAppAppointment {
  id: string
  contact_id: string
  conversation_id: string | null
  booking_id: string | null
  service_name: string | null
  preferred_date: string | null
  preferred_time: string | null
  status: AppointmentStatus
  confirmed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  contact?: WhatsAppContact
}

export interface FollowupQueueItem {
  id: string
  contact_id: string
  conversation_id: string | null
  appointment_id: string | null
  template_name: string
  message_body: string
  scheduled_at: string
  status: FollowupStatus
  sent_at: string | null
  attempt: number
  created_at: string
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  body: string
  variables: string[]
  is_approved: boolean
  created_at: string
}

// ---- Meta Cloud API Payload Types ----

export interface MetaWebhookPayload {
  object: string
  entry: MetaEntry[]
}

export interface MetaEntry {
  id: string
  changes: MetaChange[]
}

export interface MetaChange {
  value: MetaValue
  field: string
}

export interface MetaValue {
  messaging_product: string
  metadata: { display_phone_number: string; phone_number_id: string }
  contacts?: MetaContact[]
  messages?: MetaMessage[]
  statuses?: MetaStatus[]
}

export interface MetaContact {
  profile: { name: string }
  wa_id: string
}

export interface MetaMessage {
  from: string       // phone number
  id: string         // wa_message_id
  timestamp: string
  type: string
  text?: { body: string }
  button?: { payload: string; text: string }
  interactive?: {
    type: string
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
  image?: { id: string; mime_type: string; sha256: string }
  audio?: { id: string; mime_type: string }
}

export interface MetaStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
}

// ---- API Response Types ----

export interface SendMessagePayload {
  phone: string
  message: string
  type?: 'text' | 'template'
  templateName?: string
  templateParams?: string[]
}

export interface ConversationWithDetails extends WhatsAppConversation {
  contact: WhatsAppContact
  messages: WhatsAppMessage[]
  appointment?: WhatsAppAppointment
}
