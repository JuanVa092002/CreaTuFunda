import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sendOrderReceivedEmail } from '@/lib/email'
import {
  extractOrderIdFromWompiReference,
  isWompiEnabled,
  usdCentsToCopCents,
  verifyWompiEventChecksum,
  type WompiWebhookEvent,
} from '@/lib/wompi'

export async function POST(req: Request) {
  if (!isWompiEnabled()) {
    return NextResponse.json(
      { ok: false, message: 'Wompi payments are disabled on this environment.' },
      { status: 503 }
    )
  }

  let payload: WompiWebhookEvent
  try {
    payload = (await req.json()) as WompiWebhookEvent
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid JSON payload.' },
      { status: 400 }
    )
  }

  try {
    const headerChecksum = req.headers.get('x-event-checksum')

    if (!verifyWompiEventChecksum(payload, headerChecksum)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid Wompi event signature.' },
        { status: 401 }
      )
    }

    if (payload.event !== 'transaction.updated') {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const tx = payload.data?.transaction
    if (!tx || !tx.reference) {
      return NextResponse.json(
        { ok: false, message: 'Missing transaction reference.' },
        { status: 400 }
      )
    }

    if (tx.status !== 'APPROVED') {
      return NextResponse.json({ ok: true, status: tx.status })
    }

    const orderId = extractOrderIdFromWompiReference(tx.reference)
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shippingAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { ok: false, message: 'Order not found.' },
        { status: 404 }
      )
    }

    const expectedCopCents = usdCentsToCopCents(Math.round(order.amount * 100))
    if (tx.currency !== 'COP' || tx.amount_in_cents < expectedCopCents) {
      return NextResponse.json(
        { ok: false, message: 'Transaction amount or currency mismatch.' },
        { status: 400 }
      )
    }

    if (!order.isPaid) {
      const { count } = await db.order.updateMany({
        where: { id: order.id, isPaid: false },
        data: { isPaid: true },
      })

      if (count === 1 && order.shippingAddress) {
        await sendOrderReceivedEmail({
          to: order.user.email,
          orderId: order.id,
          orderDate: order.createdAt.toLocaleDateString(
            order.locale === 'en' ? 'en-US' : 'es-CO'
          ),
          shippingAddress: order.shippingAddress,
          locale: order.locale,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[wompi-webhook] Error processing event:', error)
    return NextResponse.json(
      { ok: false, message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
