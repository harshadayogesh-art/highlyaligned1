// Quick test: send a WhatsApp message to the Meta test number
// Run: npx ts-node --project tsconfig.json scratch/test-whatsapp.ts

const PHONE_NUMBER_ID = '1266527879870921'
const ACCESS_TOKEN = 'EAAMqp4jR9i8BR4xkhbZBtlj4uubrpHE95x1xl5hTVAoQIOUOX7Dyya5Xgl0QUQMEnL73r6PnN8VIoctbOFKolkFggsPTqvPLSz0gGQC6tsJ9n2Ru7wYmZB8JmS5Lj5fAEJjOUt2XR52zQHVP4fRBnqyzmiHKaivBXsSawdshOKLwsDGN9IIuNbr9E3wD0XcuwV355CuOaFEkgkx2QVI2KVd6K7EoNKksIHL6jvBPCnRWHzubZA5iJZCii2HlWiDZC8mFyvgZBmzOqTnXioqXZBIxuZAS4TkwMNMnrZBgZD'

// Meta test number (from your dev portal)
const TEST_TO = '15551819166'  // Remove + and spaces

async function sendTest() {
  console.log('Sending test message...')

  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: TEST_TO,
      type: 'text',
      text: {
        preview_url: false,
        body: '🙏 Hello from Selfaligned! Your WhatsApp CRM is connected and working perfectly. This is a test message from your admin panel.',
      },
    }),
  })

  const data = await res.json()
  
  if (res.ok) {
    console.log('✅ SUCCESS! Message sent.')
    console.log('Message ID:', data?.messages?.[0]?.id)
  } else {
    console.log('❌ FAILED:', JSON.stringify(data, null, 2))
  }
}

sendTest()
