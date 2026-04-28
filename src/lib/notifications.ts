export async function sendWhatsApp(
  to: string,
  templateName: string,
  variables: Record<string, string>
) {
  try {
    const response = await fetch('https://api.gupshup.io/sm/api/v1/template/msg', {
      method: 'POST',
      headers: {
        apikey: process.env.GUPSHUP_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'whatsapp',
        source: process.env.WHATSAPP_BUSINESS_NUMBER!,
        destination: to.replace('+', ''),
        src_name: process.env.GUPSHUP_APP_NAME!,
        template: {
          id: templateName,
          params: Object.values(variables),
        },
      }),
    })
    const data = await response.json()
    console.log('[WHATSAPP] Sent:', data)
    return data
  } catch (err) {
    console.error('[WHATSAPP] Failed:', err)
    throw err
  }
}

export async function sendSMS(to: string, message: string) {
  try {
    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID!,
        sender: process.env.MSG91_SENDER_ID || 'HGHLYA',
        short_url: 0,
        mobiles: to.replace('+', ''),
        vars: { message },
      }),
    })
    const data = await response.json()
    console.log('[SMS] Sent:', data)
    return data
  } catch (err) {
    console.error('[SMS] Failed:', err)
    throw err
  }
}

import { Resend } from 'resend'

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Harshada <harshada@highlyaligned.in>',
      to,
      subject,
      html,
    })
    console.log('[EMAIL] Sent:', data)
    return data
  } catch (err) {
    console.error('[EMAIL] Failed:', err)
    throw err
  }
}
