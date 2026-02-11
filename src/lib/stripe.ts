import Stripe from 'stripe'

/**
 * Payments are intentionally on hold. The switch lives in PAYMENTS_ENABLED so
 * the feature can be turned on later without touching the flow, and a missing
 * Stripe key keeps checkout closed even if the switch is flipped by mistake.
 */
export function isPaymentsEnabled(): boolean {
  return (
    process.env.PAYMENTS_ENABLED === 'true' &&
    Boolean(process.env.STRIPE_SECRET_KEY)
  )
}

let cachedStripe: Stripe | null = null

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is missing.')
  }

  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  }

  return cachedStripe
}
