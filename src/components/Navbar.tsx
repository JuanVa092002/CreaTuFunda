import Link from 'next/link'
import MaxWidthWrapper from './MaxWidthWrapper'
import { buttonVariants } from './ui/button'
import { ArrowRight } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { getSessionUser, isAuthConfigured } from '@/lib/auth'
import { getLocale } from '@/lib/i18n-server'
import { getMessages } from '@/lib/i18n'
import LanguageToggle from './LanguageToggle'

const Navbar = async () => {
  const user = await getSessionUser()
  const locale = await getLocale()
  const t = getMessages(locale).navbar

  const isAdmin = Boolean(
    user?.email && process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
  )

  return (
    <nav className='sticky z-[100] h-14 inset-x-0 top-0 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            Crea<span className='text-green-600'>TuFunda</span>
          </Link>

          <div className='h-full flex items-center space-x-3 sm:space-x-4'>
            <LanguageToggle />
            {user ? (
              <>
                <UserButton />
                {isAdmin ? (
                  <Link
                    href='/dashboard'
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'ghost',
                    })}>
                    {t.dashboard}
                  </Link>
                ) : null}
              </>
            ) : isAuthConfigured ? (
              <>
                <Link
                  href='/sign-up'
                  className={buttonVariants({
                    size: 'sm',
                    variant: 'ghost',
                  })}>
                  {t.signUp}
                </Link>

                <Link
                  href='/sign-in'
                  className={buttonVariants({
                    size: 'sm',
                    variant: 'ghost',
                  })}>
                  {t.login}
                </Link>

                <div className='h-8 w-px bg-zinc-200 hidden sm:block' />
              </>
            ) : null}

            <Link
              href='/configure/upload'
              className={buttonVariants({
                size: 'sm',
                className: 'hidden sm:flex items-center gap-1',
              })}>
              {t.createCase}
              <ArrowRight className='ml-1.5 h-5 w-5' />
            </Link>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  )
}

export default Navbar
