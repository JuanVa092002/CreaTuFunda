'use client'

import Phone from '@/components/Phone'
import { Button } from '@/components/ui/button'
import { BASE_PRICE, PRODUCT_PRICES } from '@/config/products'
import { cn, formatPrice } from '@/lib/utils'
import { COLORS, FINISHES, MODELS } from '@/validators/option-validator'
import { Configuration } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import Confetti from 'react-dom-confetti'
import {
  createCheckoutSession,
  createDirectOrder,
  createWompiCheckoutSession,
} from './actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import LoginModal from '@/components/LoginModal'
import ShippingModal from './ShippingModal'
import type { SessionUser } from '@/lib/auth'
import { useLocale } from '@/components/LanguageContext'

type DesignPreviewProps = {
  configuration: Configuration
  user: SessionUser | null
  authEnabled: boolean
  paymentsEnabled: boolean
  wompiEnabled: boolean
  usdToCopRate: number
}

const DesignPreview = ({
  configuration,
  user,
  authEnabled,
  paymentsEnabled,
  wompiEnabled,
  usdToCopRate,
}: DesignPreviewProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLocale()
  const { id } = configuration
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false)
  const [isShippingModalOpen, setIsShippingModalOpen] = useState<boolean>(false)

  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  useEffect(() => setShowConfetti(true))

  const { color, customColorHex, model, finish, material } = configuration

  const matchedColor = COLORS.find(
    (supportedColor) => supportedColor.value === color
  )
  const tw = matchedColor?.tw ?? 'zinc-900'
  const colorHex = customColorHex ?? matchedColor?.hex ?? '#18181b'

  const modelLabel = MODELS.options.find(({ value }) => value === model)?.label

  let totalPrice = BASE_PRICE
  if (material === 'polycarbonate')
    totalPrice += PRODUCT_PRICES.material.polycarbonate
  if (finish === 'textured') totalPrice += PRODUCT_PRICES.finish.textured

  const { mutate: createPaymentSession, isPending } = useMutation({
    mutationKey: ['get-checkout-session'],
    mutationFn: createCheckoutSession,
    onSuccess: ({ url }) => {
      if (url) router.push(url)
      else throw new Error('Unable to retrieve payment URL.')
    },
    onError: (error) => {
      toast({
        title: 'Something went wrong',
        description:
          error instanceof Error
            ? error.message
            : 'There was an error on our end. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const totalCop = Math.round(totalPrice / 100)

  const { mutate: startWompiCheckout, isPending: isStartingWompi } =
    useMutation({
      mutationKey: ['create-wompi-checkout'],
      mutationFn: createWompiCheckoutSession,
      onSuccess: ({ url }) => {
        if (url) window.location.assign(url)
        else throw new Error('Unable to retrieve Wompi checkout URL.')
      },
      onError: (error) => {
        toast({
          title: t.preview.errorTitle,
          description:
            error instanceof Error ? error.message : t.preview.errorDesc,
          variant: 'destructive',
        })
      },
    })

  const { mutate: placeDirectOrder, isPending: isPlacingOrder } = useMutation({
    mutationKey: ['create-direct-order'],
    mutationFn: createDirectOrder,
    onSuccess: ({ orderId }) => {
      setIsShippingModalOpen(false)
      router.push(`/thank-you?orderId=${orderId}`)
    },
    onError: (error) => {
      toast({
        title: t.preview.errorTitle,
        description:
          error instanceof Error ? error.message : t.preview.errorDesc,
        variant: 'destructive',
      })
    },
  })

  const handleCheckout = () => {
    if (!user) {
      if (authEnabled) {
        setIsLoginModalOpen(true)
      } else {
        toast({
          title: t.preview.authUnavailableTitle,
          description: t.preview.authUnavailableDesc,
          variant: 'destructive',
        })
      }
      return
    }

    if (wompiEnabled) {
      setIsShippingModalOpen(true)
    } else if (paymentsEnabled) {
      createPaymentSession({ configId: id })
    } else {
      setIsShippingModalOpen(true)
    }
  }

  return (
    <>
      <div
        aria-hidden='true'
        className='pointer-events-none select-none absolute inset-0 overflow-hidden flex justify-center'>
        <Confetti
          active={showConfetti}
          config={{ elementCount: 200, spread: 90 }}
        />
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        setIsOpen={setIsLoginModalOpen}
        authEnabled={authEnabled}
        redirectUrl={`/configure/preview?id=${id}`}
      />

      <ShippingModal
        isOpen={isShippingModalOpen}
        setIsOpen={setIsShippingModalOpen}
        isPending={isPlacingOrder || isStartingWompi}
        wompiEnabled={wompiEnabled}
        totalCop={totalCop}
        onSubmit={(shippingAddress) => {
          if (wompiEnabled) {
            startWompiCheckout({ configId: id, shippingAddress })
          } else {
            placeDirectOrder({ configId: id, shippingAddress })
          }
        }}
      />

      <div className='mt-20 flex flex-col items-center md:grid text-sm sm:grid-cols-12 sm:grid-rows-1 sm:gap-x-6 md:gap-x-8 lg:gap-x-12'>
        <div className='md:col-span-4 lg:col-span-3 md:row-span-2 md:row-end-2'>
          <Phone
            className={cn(`bg-${tw}`, 'max-w-[150px] md:max-w-full')}
            style={{ backgroundColor: colorHex }}
            model={model}
            imgSrc={
              configuration.croppedImageUrl ?? configuration.imageUrl
            }
          />
        </div>

        <div className='mt-6 sm:col-span-9 md:row-end-1'>
          <h3 className='text-3xl font-bold tracking-tight text-gray-900'>
            {t.preview.yourCasePrefix} {modelLabel ?? ''}
          </h3>
          <div className='mt-3 flex items-center gap-1.5 text-base'>
            <Check className='h-4 w-4 text-green-500' />
            {t.preview.inStock}
          </div>
        </div>

        <div className='sm:col-span-12 md:col-span-9 text-base'>
          <div className='grid grid-cols-1 gap-y-8 border-b border-gray-200 py-8 sm:grid-cols-2 sm:gap-x-6 sm:py-6 md:py-10'>
            <div>
              <p className='font-medium text-zinc-950'>
                {t.preview.highlightsTitle}
              </p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                {t.preview.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className='font-medium text-zinc-950'>
                {t.preview.materialsTitle}
              </p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                {t.preview.materials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className='mt-8'>
            <div className='bg-gray-50 p-6 sm:rounded-lg sm:p-8'>
              <div className='flow-root text-sm'>
                <div className='flex items-center justify-between py-1 mt-2'>
                  <p className='text-gray-600'>{t.preview.basePrice}</p>
                  <p className='font-medium text-gray-900'>
                    {formatPrice(BASE_PRICE / 100)}
                  </p>
                </div>

                {finish === 'textured' ? (
                  <div className='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>{t.preview.texturedFinish}</p>
                    <p className='font-medium text-gray-900'>
                      {formatPrice(PRODUCT_PRICES.finish.textured / 100)}
                    </p>
                  </div>
                ) : null}

                {material === 'polycarbonate' ? (
                  <div className='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>
                      {t.preview.polycarbonateMaterial}
                    </p>
                    <p className='font-medium text-gray-900'>
                      {formatPrice(PRODUCT_PRICES.material.polycarbonate / 100)}
                    </p>
                  </div>
                ) : null}

                <div className='my-2 h-px bg-gray-200' />

                <div className='flex items-center justify-between py-2'>
                  <p className='font-semibold text-gray-900'>
                    {t.preview.orderTotal}
                  </p>
                  <p className='font-semibold text-gray-900'>
                    {formatPrice(totalPrice / 100)}
                  </p>
                </div>
              </div>
            </div>

            <div className='mt-8 flex flex-col items-end gap-2 pb-12'>
              <Button
                onClick={() => handleCheckout()}
                disabled={isPending || isPlacingOrder || isStartingWompi}
                className='px-4 sm:px-6 lg:px-8'>
                {isPending || isPlacingOrder || isStartingWompi
                  ? t.preview.processing
                  : wompiEnabled
                  ? t.preview.checkoutWompi
                  : paymentsEnabled
                  ? t.preview.checkout
                  : t.preview.placeOrder}
                <ArrowRight className='h-4 w-4 ml-1.5 inline' />
              </Button>

              {wompiEnabled ? (
                <p className='text-sm text-zinc-500'>{t.preview.wompiNote}</p>
              ) : !paymentsEnabled ? (
                <p className='text-sm text-zinc-500'>
                  {t.preview.paymentsHoldNote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DesignPreview
