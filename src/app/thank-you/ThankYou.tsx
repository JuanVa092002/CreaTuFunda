'use client'

import { useQuery } from '@tanstack/react-query'
import { getPaymentStatus } from './actions'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import PhonePreview from '@/components/PhonePreview'
import { buttonVariants } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useLocale } from '@/components/LanguageContext'

const ThankYou = () => {
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const transactionId = searchParams.get('id') || undefined

  const { data, isError, error } = useQuery({
    queryKey: ['get-payment-status', orderId, transactionId],
    queryFn: async () => await getPaymentStatus({ orderId, transactionId }),
    refetchInterval: (query) => (query.state.data === false ? 2000 : false),
    retry: (failureCount, err) => {
      if (err instanceof Error && (
        err.message.includes('logged in') ||
        err.message.includes('does not exist') ||
        err.message.includes('Missing order ID') ||
        err.message.includes('not approved')
      )) {
        return false
      }
      return failureCount < 10
    },
    retryDelay: 500,
  })

  if (isError) {
    return (
      <div className='w-full mt-24 flex justify-center px-4'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <h3 className='font-semibold text-xl'>{t.thankYou.errorTitle}</h3>
          <p className='text-sm text-zinc-600'>
            {error instanceof Error
              ? error.message
              : t.thankYou.errorFallback}
          </p>
          <Link href='/' className={buttonVariants({ variant: 'outline' })}>
            {t.thankYou.backHome}
          </Link>
        </div>
      </div>
    )
  }

  if (data === undefined) {
    return (
      <div className='w-full mt-24 flex justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
          <h3 className='font-semibold text-xl'>{t.thankYou.loadingTitle}</h3>
          <p>{t.thankYou.loadingDesc}</p>
        </div>
      </div>
    )
  }

  if (data === false) {
    return (
      <div className='w-full mt-24 flex justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-zinc-500' />
          <h3 className='font-semibold text-xl'>{t.thankYou.verifyingTitle}</h3>
          <p>{t.thankYou.verifyingDesc}</p>
        </div>
      </div>
    )
  }

  const { configuration, billingAddress, shippingAddress, amount } = data
  const { color } = configuration

  return (
    <div className='bg-white'>
      <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
        <div className='max-w-xl'>
          <p className='text-base font-medium text-primary'>
            {t.thankYou.badge}
          </p>
          <h1 className='mt-2 text-4xl font-bold tracking-tight sm:text-5xl'>
            {t.thankYou.heading}
          </h1>
          <p className='mt-2 text-base text-zinc-500'>
            {t.thankYou.subheading}
          </p>

          <div className='mt-12 text-sm font-medium'>
            <p className='text-zinc-900'>{t.thankYou.orderNumber}</p>
            <p className='mt-2 text-zinc-500'>{orderId}</p>
          </div>
        </div>

        <div className='mt-10 border-t border-zinc-200'>
          <div className='mt-10 flex flex-auto flex-col'>
            <h4 className='font-semibold text-zinc-900'>
              {t.thankYou.choiceTitle}
            </h4>
            <p className='mt-2 text-sm text-zinc-600'>
              {t.thankYou.choiceDesc}
            </p>
          </div>
        </div>

        <div className='flex space-x-6 overflow-hidden mt-4 rounded-xl bg-gray-900/5 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl'>
          <PhonePreview
            croppedImageUrl={configuration.croppedImageUrl!}
            color={color!}
            customColorHex={configuration.customColorHex}
            model={configuration.model}
          />
        </div>

        <div>
          <div className='grid grid-cols-2 gap-x-6 py-10 text-sm'>
            <div>
              <p className='font-medium text-gray-900'>
                {t.thankYou.shippingAddress}
              </p>
              <div className='mt-2 text-zinc-700'>
                <address className='not-italic'>
                  <span className='block'>{shippingAddress?.name}</span>
                  <span className='block'>{shippingAddress?.street}</span>
                  <span className='block'>
                    {shippingAddress?.postalCode} {shippingAddress?.city}
                  </span>
                </address>
              </div>
            </div>
            <div>
              <p className='font-medium text-gray-900'>
                {t.thankYou.billingAddress}
              </p>
              <div className='mt-2 text-zinc-700'>
                <address className='not-italic'>
                  <span className='block'>{billingAddress?.name}</span>
                  <span className='block'>{billingAddress?.street}</span>
                  <span className='block'>
                    {billingAddress?.postalCode} {billingAddress?.city}
                  </span>
                </address>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-x-6 border-t border-zinc-200 py-10 text-sm'>
            <div>
              <p className='font-medium text-zinc-900'>
                {t.thankYou.paymentStatus}
              </p>
              <p className='mt-2 text-zinc-700'>
                {data.isPaid ? t.thankYou.paid : t.thankYou.pendingHold}
              </p>
            </div>

            <div>
              <p className='font-medium text-zinc-900'>
                {t.thankYou.shippingMethod}
              </p>
              <p className='mt-2 text-zinc-700'>
                {t.thankYou.shippingMethodValue}
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-6 border-t border-zinc-200 pt-10 text-sm'>
          <div className='flex justify-between'>
            <p className='font-medium text-zinc-900'>{t.thankYou.subtotal}</p>
            <p className='text-zinc-700'>{formatPrice(amount)}</p>
          </div>
          <div className='flex justify-between'>
            <p className='font-medium text-zinc-900'>{t.thankYou.shipping}</p>
            <p className='text-zinc-700'>{formatPrice(0)}</p>
          </div>
          <div className='flex justify-between'>
            <p className='font-medium text-zinc-900'>{t.thankYou.total}</p>
            <p className='text-zinc-700'>{formatPrice(amount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThankYou
