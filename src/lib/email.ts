import { Resend } from 'resend'
import { render } from '@react-email/components'
import type { ShippingAddress } from '@prisma/client'
import OrderReceivedEmail from '@/components/emails/OrderReceivedEmail'
import { normalizeLocale, type Locale } from './i18n'

export type SendOrderEmailResult =
  | { sent: true; id: string | null; provider: 'brevo' | 'resend' }
  | { sent: false; reason: string }

/**
 * Sends the order confirmation email using Brevo (primary, 300/day free to any
 * recipient) with Resend as fallback. Fails soft so email delivery issues never
 * block order creation or webhook acknowledgment.
 */
export async function sendOrderReceivedEmail({
  to,
  orderId,
  orderDate,
  shippingAddress,
  locale,
}: {
  to: string
  orderId: string
  orderDate: string
  shippingAddress: ShippingAddress
  locale?: Locale | string | null
}): Promise<SendOrderEmailResult> {
  const resolvedLocale = normalizeLocale(locale)
  const subject =
    resolvedLocale === 'en'
      ? 'Thanks for your order!'
      : '¡Gracias por tu pedido!'
  const emailElement = OrderReceivedEmail({
    orderId,
    orderDate,
    shippingAddress,
    locale: resolvedLocale,
  })

  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL
    const senderName = process.env.BREVO_SENDER_NAME || 'CreaTuFunda'

    if (senderEmail) {
      try {
        const htmlContent = await render(emailElement)
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': brevoApiKey,
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: to }],
            subject,
            htmlContent,
          }),
        })

        const json = (await res.json()) as {
          messageId?: string
          message?: string
        }

        if (res.ok) {
          return { sent: true, id: json.messageId ?? null, provider: 'brevo' }
        }

        console.warn(
          '[email] Brevo rejected order email:',
          json.message ?? res.statusText
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown Brevo error'
        console.warn('[email] Failed to send via Brevo:', message)
      }
    } else {
      console.warn('[email] BREVO_SENDER_EMAIL is missing; falling back.')
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('[email] No email provider configured; skipping order email.')
    return { sent: false, reason: 'missing_api_key' }
  }

  const from =
    process.env.RESEND_FROM_EMAIL || 'CreaTuFunda <onboarding@resend.dev>'

  try {
    const resend = new Resend(resendApiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      react: emailElement,
    })

    if (error) {
      console.warn('[email] Resend rejected order email:', error.message)
      return { sent: false, reason: error.message }
    }

    return { sent: true, id: data?.id ?? null, provider: 'resend' }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown email error'
    console.warn('[email] Failed to send order email:', message)
    return { sent: false, reason: message }
  }
}
