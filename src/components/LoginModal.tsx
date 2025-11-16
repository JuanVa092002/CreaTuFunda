import type { Dispatch, SetStateAction } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import Image from 'next/image'
import { buttonVariants } from './ui/button'
import { useLocale } from './LanguageContext'

const LoginModal = ({
  isOpen,
  setIsOpen,
  authEnabled,
  redirectUrl,
}: {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  authEnabled: boolean
  redirectUrl?: string
}) => {
  const { t } = useLocale()
  const signInHref = redirectUrl
    ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/sign-in'

  const signUpHref = redirectUrl
    ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/sign-up'

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className='absolute z-[9999999]'>
        <DialogHeader>
          <div className='relative mx-auto w-24 h-24 mb-2'>
            <Image
              src='/snake-1.png'
              alt='CreaTuFunda'
              className='object-contain'
              fill
            />
          </div>
          <DialogTitle className='text-3xl text-center font-bold tracking-tight text-gray-900'>
            {t.loginModal.title}
          </DialogTitle>
          <DialogDescription className='text-base text-center py-2'>
            <span className='font-medium text-zinc-900'>
              {t.loginModal.saved}
            </span>{' '}
            {authEnabled ? t.loginModal.prompt : t.loginModal.notConfigured}
          </DialogDescription>
        </DialogHeader>

        {authEnabled ? (
          <div className='grid grid-cols-2 gap-6 divide-x divide-gray-200'>
            <a href={signInHref} className={buttonVariants({ variant: 'outline' })}>
              {t.loginModal.login}
            </a>
            <a href={signUpHref} className={buttonVariants({ variant: 'default' })}>
              {t.loginModal.signUp}
            </a>
          </div>
        ) : (
          <p className='text-center text-sm text-zinc-500'>
            {t.loginModal.missingKeys}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
