import { Resend } from 'resend'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testEmail() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    console.log('Sending from:', process.env.FROM_EMAIL)
    const data = await resend.emails.send({
      from: `Selfaligned <${process.env.FROM_EMAIL || 'info@selfaligned.in'}>`,
      to: 'info@selfaligned.in',
      subject: 'Test Email',
      html: '<p>This is a test email.</p>',
    })
    
    if (data.error) {
      console.error('Resend returned an error:', data.error.message)
    } else {
      console.log('Email sent successfully:', data)
    }
  } catch (err) {
    console.error('Caught exception:', err)
  }
}

testEmail()
