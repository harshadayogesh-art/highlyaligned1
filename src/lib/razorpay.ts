declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color: string
  }
  config?: {
    display?: {
      blocks?: Record<string, {
        name: string
        instruments: Array<{
          method: string
          flows?: string[]
        }>
      }>
      sequence?: string[]
      preferences?: {
        show_default_blocks?: boolean
      }
    }
  }
  remember_customer?: boolean
  readonly?: boolean
  hidden?: {
    contact?: boolean
    email?: boolean
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayPaymentFailedResponse {
  error: {
    code: string
    description: string
    source: string
    step: string
    reason: string
    metadata: {
      order_id: string
      payment_id: string
    }
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayPaymentFailedResponse) => void) => void
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function createRazorpayOrder({
  amount,
  receipt,
}: {
  amount: number
  receipt: string
}) {
  const res = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, receipt }),
  })
  if (!res.ok) throw new Error('Failed to create Razorpay order')
  return res.json() as Promise<{ orderId: string; amount: number; currency: string }>
}

export function openRazorpayCheckout({
  orderId,
  amountInPaise,
  name,
  description,
  prefill,
  onSuccess,
  onDismiss,
  onError,
}: {
  orderId: string
  amountInPaise: number
  name: string
  description: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (response: RazorpayResponse) => void
  onDismiss?: () => void
  onError?: (response: RazorpayPaymentFailedResponse) => void
}) {
  const options: RazorpayOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount: amountInPaise,
    currency: 'INR',
    name,
    description,
    order_id: orderId,
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
    prefill,
    theme: { color: '#f59e0b' },
  }

  const rzp = new window.Razorpay(options)

  if (onError) {
    rzp.on('payment.failed', onError)
  }

  rzp.open()
  return rzp
}

export type { RazorpayResponse, RazorpayPaymentFailedResponse }
