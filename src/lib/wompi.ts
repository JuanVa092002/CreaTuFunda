import crypto from 'node:crypto'

export const DEFAULT_USD_TO_COP_RATE = 4000

export function isWompiEnabled(): boolean {
  return (
    process.env.PAYMENTS_ENABLED === 'true' &&
    Boolean(
      process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY &&
        process.env.WOMPI_INTEGRITY_SECRET &&
        process.env.WOMPI_EVENTS_SECRET
    )
  )
}

export function getWompiUsdToCopRate(): number {
  const raw = Number(process.env.WOMPI_USD_TO_COP_RATE)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_USD_TO_COP_RATE
}

export function usdCentsToCopCents(copCents: number): number {
  return Math.round(copCents)
}

export function getWompiConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
  const privateKey = process.env.WOMPI_PRIVATE_KEY
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET

  if (!publicKey || !eventsSecret || !integritySecret) {
    throw new Error('Wompi is not fully configured.')
  }

  const isSandbox = publicKey.startsWith('pub_test_')
  const apiBaseUrl = isSandbox
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'

  return {
    publicKey,
    privateKey,
    eventsSecret,
    integritySecret,
    apiBaseUrl,
    isSandbox,
  }
}

/**
 * Generates the SHA-256 integrity signature required by Wompi Web Checkout:
 * SHA256(reference + amountInCents + currency + integritySecret)
 */
export function extractOrderIdFromWompiReference(reference: string): string {
  return reference.split('-')[0] || reference
}

export function createWompiIntegritySignature({
  reference,
  amountInCents,
  currency = 'COP',
}: {
  reference: string
  amountInCents: number
  currency?: string
}): string {
  const { integritySecret } = getWompiConfig()
  return crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest('hex')
}

export function buildWompiCheckoutUrl({
  reference,
  amountInCents,
  redirectUrl,
  customerEmail,
  customerName,
  customerPhone,
}: {
  reference: string
  amountInCents: number
  redirectUrl: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string | null
}): string {
  const { publicKey } = getWompiConfig()
  const currency = 'COP'
  const signature = createWompiIntegritySignature({
    reference,
    amountInCents,
    currency,
  })

  const params = new URLSearchParams({
    'public-key': publicKey,
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': signature,
  })

  // CloudFront WAF on checkout.wompi.co blocks http://localhost in redirect-url (403).
  if (redirectUrl.startsWith('https://')) {
    params.set('redirect-url', redirectUrl)
  }

  if (customerEmail) {
    params.set('customer-data:email', customerEmail)
  }
  if (customerName) {
    params.set('customer-data:full-name', customerName)
  }
  if (customerPhone) {
    params.set('customer-data:phone-number', customerPhone)
  }

  return `https://checkout.wompi.co/p/?${params.toString()}`
}

export type WompiTransaction = {
  id: string
  amount_in_cents: number
  reference: string
  currency: string
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING'
  customer_email?: string | null
  payment_method_type?: string
}

export type WompiWebhookEvent = {
  event: string
  data: {
    transaction?: WompiTransaction
    [key: string]: unknown
  }
  signature?: {
    properties?: string[]
    checksum?: string
  }
  timestamp?: number
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return ''
    current = (current as Record<string, unknown>)[part]
  }
  return current === undefined || current === null ? '' : String(current)
}

/**
 * Verifies Wompi webhook signature according to Wompi's event checksum spec:
 * SHA256(concat(properties from data) + timestamp + eventsSecret)
 */
export function verifyWompiEventChecksum(
  payload: WompiWebhookEvent,
  headerChecksum?: string | null
): boolean {
  const { eventsSecret } = getWompiConfig()
  const properties = payload.signature?.properties
  const bodyChecksum = payload.signature?.checksum

  if (!Array.isArray(properties) || !bodyChecksum || payload.timestamp == null) {
    return false
  }

  if (
    headerChecksum &&
    headerChecksum.toLowerCase() !== bodyChecksum.toLowerCase()
  ) {
    return false
  }

  const values = properties
    .map((prop) => getNestedValue(payload.data, prop))
    .join('')

  const computed = crypto
    .createHash('sha256')
    .update(`${values}${payload.timestamp}${eventsSecret}`)
    .digest('hex')

  const computedBuf = Buffer.from(computed, 'utf8')
  const receivedBuf = Buffer.from(bodyChecksum.toLowerCase(), 'utf8')

  if (computedBuf.length !== receivedBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(computedBuf, receivedBuf)
}

export async function fetchWompiTransaction(
  transactionId: string
): Promise<WompiTransaction | null> {
  const { apiBaseUrl, privateKey } = getWompiConfig()
  const headers: Record<string, string> = {}
  if (privateKey) {
    headers.Authorization = `Bearer ${privateKey}`
  }

  const res = await fetch(`${apiBaseUrl}/transactions/${encodeURIComponent(transactionId)}`, {
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    return null
  }

  const json = (await res.json()) as { data?: WompiTransaction }
  return json.data ?? null
}
