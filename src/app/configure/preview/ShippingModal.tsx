'use client'

import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowRight } from 'lucide-react'
import type { ShippingAddressInput } from './actions'
import { useLocale } from '@/components/LanguageContext'
import { formatPrice } from '@/lib/utils'

type ShippingModalProps = {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  isPending: boolean
  wompiEnabled?: boolean
  totalCop?: number
  onSubmit: (shippingAddress: ShippingAddressInput) => void
}

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const ShippingModal = ({
  isOpen,
  setIsOpen,
  isPending,
  wompiEnabled,
  totalCop,
  onSubmit,
}: ShippingModalProps) => {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({
      name,
      street,
      city,
      state: state || undefined,
      postalCode,
      country,
      phoneNumber: phoneNumber || undefined,
    })
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className='sm:max-w-md z-[9999999]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold tracking-tight text-gray-900'>
            {t.shippingModal.title}
          </DialogTitle>
          <DialogDescription>
            {wompiEnabled
              ? `${t.shippingModal.descriptionWompi}${
                  totalCop ? ` (${formatPrice(totalCop)} COP)` : ''
                }.`
              : t.shippingModal.descriptionHold}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 mt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='shipping-name'>{t.shippingModal.fullName}</Label>
            <input
              id='shipping-name'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.shippingModal.fullNamePlaceholder}
              className={inputClassName}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='shipping-street'>{t.shippingModal.street}</Label>
            <input
              id='shipping-street'
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder={t.shippingModal.streetPlaceholder}
              className={inputClassName}
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='shipping-city'>{t.shippingModal.city}</Label>
              <input
                id='shipping-city'
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t.shippingModal.cityPlaceholder}
                className={inputClassName}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='shipping-state'>{t.shippingModal.state}</Label>
              <input
                id='shipping-state'
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder={t.shippingModal.statePlaceholder}
                className={inputClassName}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='shipping-postal'>
                {t.shippingModal.postalCode}
              </Label>
              <input
                id='shipping-postal'
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={t.shippingModal.postalCodePlaceholder}
                className={inputClassName}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='shipping-country'>
                {t.shippingModal.country}
              </Label>
              <input
                id='shipping-country'
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t.shippingModal.countryPlaceholder}
                className={inputClassName}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='shipping-phone'>{t.shippingModal.phone}</Label>
            <input
              id='shipping-phone'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t.shippingModal.phonePlaceholder}
              className={inputClassName}
            />
          </div>

          <Button type='submit' disabled={isPending} className='w-full'>
            {isPending
              ? wompiEnabled
                ? t.shippingModal.redirectingWompi
                : t.shippingModal.placingOrder
              : wompiEnabled
              ? t.shippingModal.continueWompi
              : t.shippingModal.confirmOrder}
            <ArrowRight className='h-4 w-4 ml-1.5 inline' />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ShippingModal
