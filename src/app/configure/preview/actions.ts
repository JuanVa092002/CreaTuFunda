'use server'

import { BASE_PRICE, PRODUCT_PRICES } from '@/config/products'
import { db } from '@/db'
import { getSessionUser } from '@/lib/auth'
import { sendOrderReceivedEmail } from '@/lib/email'
import { getLocale } from '@/lib/i18n-server'
import { getStripe, isPaymentsEnabled } from '@/lib/stripe'
import {
  buildWompiCheckoutUrl,
  isWompiEnabled,
  usdCentsToCopCents,
} from '@/lib/wompi'
import { CaseFinish, CaseMaterial, Order } from '@prisma/client'

function calculateCasePrice(
  finish: CaseFinish | null,
  material: CaseMaterial | null
): number {
  let price = BASE_PRICE
  if (finish === 'textured') price += PRODUCT_PRICES.finish.textured
  if (material === 'polycarbonate')
    price += PRODUCT_PRICES.material.polycarbonate
  return price
}

export type ShippingAddressInput = {
  name: string
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
  phoneNumber?: string
}

async function upsertOrderWithShipping({
  userId,
  configId,
  shippingAddress,
}: {
  userId: string
  configId: string
  shippingAddress: ShippingAddressInput
}) {
  const configuration = await db.configuration.findUnique({
    where: { id: configId },
  })
  if (!configuration) {
    throw new Error('No such configuration found')
  }

  const name = shippingAddress.name.trim()
  const street = shippingAddress.street.trim()
  const city = shippingAddress.city.trim()
  const postalCode = shippingAddress.postalCode.trim()
  const country = shippingAddress.country.trim()
  const state = shippingAddress.state?.trim() || null
  const phoneNumber = shippingAddress.phoneNumber?.trim() || null

  if (!name || !street || !city || !postalCode || !country) {
    throw new Error('Please fill in all required shipping address fields.')
  }

  const priceUsdCents = calculateCasePrice(
    configuration.finish,
    configuration.material
  )
  const addressData = {
    name,
    street,
    city,
    postalCode,
    country,
    state,
    phoneNumber,
  }

  const existingOrder = await db.order.findFirst({
    where: {
      userId,
      configurationId: configuration.id,
    },
    include: { shippingAddress: true },
  })

  if (existingOrder?.isPaid) {
    return { order: existingOrder, priceUsdCents, addressData }
  }

  const locale = await getLocale()

  const order = existingOrder
    ? await db.order.update({
        where: { id: existingOrder.id },
        data: {
          amount: priceUsdCents / 100,
          locale,
          shippingAddress: existingOrder.shippingAddressId
            ? { update: addressData }
            : { create: addressData },
          billingAddress: existingOrder.billingAddressId
            ? { update: addressData }
            : { create: addressData },
        },
        include: { shippingAddress: true },
      })
    : await db.order.create({
        data: {
          amount: priceUsdCents / 100,
          locale,
          user: { connect: { id: userId } },
          configuration: { connect: { id: configuration.id } },
          isPaid: false,
          shippingAddress: { create: addressData },
          billingAddress: { create: addressData },
        },
        include: { shippingAddress: true },
      })

  return { order, priceUsdCents, addressData }
}

export const createDirectOrder = async ({
  configId,
  shippingAddress,
}: {
  configId: string
  shippingAddress: ShippingAddressInput
}) => {
  if (isPaymentsEnabled() || isWompiEnabled()) {
    throw new Error('Payments are enabled; use the payment checkout.')
  }

  const user = await getSessionUser()
  if (!user) {
    throw new Error('You need to be logged in')
  }

  const { order } = await upsertOrderWithShipping({
    userId: user.id,
    configId,
    shippingAddress,
  })

  const emailResult = order.shippingAddress
    ? await sendOrderReceivedEmail({
        to: user.email,
        orderId: order.id,
        orderDate: order.createdAt.toLocaleDateString(
          order.locale === 'en' ? 'en-US' : 'es-CO'
        ),
        shippingAddress: order.shippingAddress,
        locale: order.locale,
      })
    : { sent: false, reason: 'missing_shipping_address' }

  return { orderId: order.id, emailSent: emailResult.sent }
}

export const createWompiCheckoutSession = async ({
  configId,
  shippingAddress,
}: {
  configId: string
  shippingAddress: ShippingAddressInput
}) => {
  if (!isWompiEnabled()) {
    throw new Error('Wompi payments are disabled on this environment.')
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  if (!serverUrl) {
    throw new Error('NEXT_PUBLIC_SERVER_URL is not configured.')
  }

  const user = await getSessionUser()
  if (!user) {
    throw new Error('You need to be logged in')
  }

  const { order, priceUsdCents, addressData } = await upsertOrderWithShipping({
    userId: user.id,
    configId,
    shippingAddress,
  })

  if (order.isPaid) {
    return { url: `${serverUrl}/thank-you?orderId=${order.id}` }
  }

  const amountInCents = usdCentsToCopCents(priceUsdCents)
  const reference = `${order.id}-${Date.now()}`
  const url = buildWompiCheckoutUrl({
    reference,
    amountInCents,
    redirectUrl: `${serverUrl}/thank-you?orderId=${order.id}`,
    customerEmail: user.email,
    customerName: addressData.name,
    customerPhone: addressData.phoneNumber,
  })

  return { url }
}

export const createCheckoutSession = async ({
  configId,
}: {
  configId: string
}) => {
  if (!isPaymentsEnabled()) {
    throw new Error('Payments are disabled on this environment.')
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  if (!serverUrl) {
    throw new Error('NEXT_PUBLIC_SERVER_URL is not configured.')
  }

  const configuration = await db.configuration.findUnique({
    where: { id: configId },
  })

  if (!configuration) {
    throw new Error('No such configuration found')
  }

  const user = await getSessionUser()

  if (!user) {
    throw new Error('You need to be logged in')
  }

  const price = calculateCasePrice(
    configuration.finish,
    configuration.material
  )

  let order: Order | undefined = undefined

  const existingOrder = await db.order.findFirst({
    where: {
      userId: user.id,
      configurationId: configuration.id,
    },
  })

  if (existingOrder) {
    order = existingOrder
  } else {
    order = await db.order.create({
      data: {
        amount: price / 100,
        userId: user.id,
        configurationId: configuration.id,
      },
    })
  }

  const stripe = getStripe()

  const product = await stripe.products.create({
    name: 'Custom iPhone Case',
    images: [configuration.imageUrl],
    default_price_data: {
      currency: 'USD',
      unit_amount: price,
    },
  })

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: `${serverUrl}/thank-you?orderId=${order.id}`,
    cancel_url: `${serverUrl}/configure/preview?id=${configuration.id}`,
    payment_method_types: ['card', 'paypal'],
    mode: 'payment',
    shipping_address_collection: { allowed_countries: ['DE', 'US'] },
    metadata: {
      userId: user.id,
      orderId: order.id,
    },
    line_items: [{ price: product.default_price as string, quantity: 1 }],
  })

  return { url: stripeSession.url }
}
