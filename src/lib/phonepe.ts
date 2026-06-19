import {
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
  Env,
} from '@phonepe-pg/pg-sdk-node'

function getEnv(): Env {
  const envStr = process.env.PHONEPE_ENV ?? 'SANDBOX'
  return envStr === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX
}

let _client: StandardCheckoutClient | null = null

export function getPhonePeClient(): StandardCheckoutClient {
  if (_client) return _client

  const clientId = process.env.PHONEPE_CLIENT_ID
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET
  const clientVersionStr = process.env.PHONEPE_CLIENT_VERSION

  if (!clientId || !clientSecret || !clientVersionStr) {
    throw new Error(
      'PhonePe credentials not configured. Set PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, and PHONEPE_CLIENT_VERSION in .env.local'
    )
  }

  const clientVersion = parseInt(clientVersionStr, 10)
  if (isNaN(clientVersion)) {
    throw new Error('PHONEPE_CLIENT_VERSION must be a number')
  }

  _client = StandardCheckoutClient.getInstance(
    clientId,
    clientSecret,
    clientVersion,
    getEnv()
  )
  return _client
}

/**
 * Initiates a PhonePe Standard Checkout payment.
 * Returns the hosted checkout redirect URL to send the user to.
 */
export async function initiatePhonePePayment({
  merchantOrderId,
  amountInPaise,
  redirectUrl,
  mobileNumber,
}: {
  merchantOrderId: string
  amountInPaise: number
  redirectUrl: string
  mobileNumber?: string
}): Promise<string> {
  const client = getPhonePeClient()

  const requestBuilder = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl)

  if (mobileNumber) {
    const { PrefillUserLoginDetails } = await import('@phonepe-pg/pg-sdk-node')
    const prefill = PrefillUserLoginDetails.builder()
      .phoneNumber(mobileNumber)
      .build()
    requestBuilder.prefillUserLoginDetails(prefill)
  }

  const request = requestBuilder.build()
  const response = await client.pay(request)
  return response.redirectUrl
}

/**
 * Checks the current payment status of an order from PhonePe.
 * state values: PENDING | COMPLETED | FAILED | CANCELLED
 */
export async function getPhonePeOrderStatus(merchantOrderId: string) {
  const client = getPhonePeClient()
  return client.getOrderStatus(merchantOrderId)
}
