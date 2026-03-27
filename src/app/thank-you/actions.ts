'use server'

import { db } from '@/db'
import { getSessionUser } from '@/lib/auth'
import { sendOrderReceivedEmail } from '@/lib/email'
import { isPaymentsEnabled } from '@/lib/stripe'
import {
  extractOrderIdFromWompiReference,
  fetchWompiTransaction,
  isWompiEnabled,
  usdCentsToCopCents,
} from '@/lib/wompi'

export const getPaymentStatus = async ({
  orderId,
  transactionId,
}: {
  orderId: string
  transactionId?: string
}) => {
  if (!orderId) {
    throw new Error('Missing order ID.')
  }

  const user = await getSessionUser()

  if (!user) {
    throw new Error('You need to be logged in to view this page.')
  }

  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      billingAddress: true,
      configuration: true,
      shippingAddress: true,
      user: true,
    },
  })

  if (!order) throw new Error('This order does not exist.')

  if (!order.isPaid && isWompiEnabled() && transactionId) {
    const tx = await fetchWompiTransaction(transactionId)
    if (tx && extractOrderIdFromWompiReference(tx.reference) === order.id) {
      if (tx.status === 'APPROVED') {
        const expectedCopCents = usdCentsToCopCents(
          Math.round(order.amount * 100)
        )
        if (tx.currency === 'COP' && tx.amount_in_cents >= expectedCopCents) {
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

          return { ...order, isPaid: true }
        }
      } else if (
        tx.status === 'DECLINED' ||
        tx.status === 'ERROR' ||
        tx.status === 'VOIDED'
      ) {
        throw new Error(`Your payment was not approved (${tx.status}).`)
      }
    }
  }

  if (order.isPaid || (!isPaymentsEnabled() && !isWompiEnabled())) {
    return order
  } else {
    return false
  }
}
