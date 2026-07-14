// WhatsApp API Client - Meta Cloud API
// Handles sending messages via Meta WhatsApp Cloud API

const WA_API_BASE = 'https://graph.facebook.com/v19.0'

function getPhoneNumberId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID!
}

function getToken() {
  return process.env.WHATSAPP_ACCESS_TOKEN!
}

async function waFetch(endpoint: string, body: Record<string, unknown>) {
  const url = `${WA_API_BASE}/${getPhoneNumberId()}/${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[WA API Error]', data)
    throw new Error(data?.error?.message || 'WhatsApp API error')
  }
  return data
}

// Send a plain text message
export async function sendTextMessage(to: string, text: string) {
  return waFetch('messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  })
}

// Send interactive button message (max 3 buttons)
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
  return waFetch('messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) }, // Max 20 chars
        })),
      },
    },
  })
}

// Send interactive list message (for 4+ options)
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
) {
  return waFetch('messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonLabel,
        sections,
      },
    },
  })
}

// Send a pre-approved Meta template message
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  language: string = 'en',
  params: string[] = []
) {
  const components = params.length > 0
    ? [{
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', text: p })),
      }]
    : []

  return waFetch('messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  })
}

// Mark a message as read
export async function markMessageRead(messageId: string) {
  return waFetch('messages', {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  })
}
