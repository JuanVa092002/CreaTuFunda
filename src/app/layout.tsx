import type { Metadata } from 'next'
import { Recursive } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import Providers from '@/components/Providers'
import { constructMetadata } from '@/lib/utils'
import { ClerkProvider } from '@clerk/nextjs'
import { enUS, esES } from '@clerk/localizations'
import { isAuthConfigured } from '@/lib/auth'
import { getLocale } from '@/lib/i18n-server'
import { LanguageProvider } from '@/components/LanguageContext'

const recursive = Recursive({ subsets: ['latin'] })

export const metadata = constructMetadata()

/**
 * The navbar and every page read the Clerk session, so a prerendered
 * signed-out shell would be wrong: the auth state must be resolved per
 * request. Forcing dynamic rendering at the root segment keeps `/dashboard`
 * and the navbar honest once Clerk keys are present.
 */
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  const html = (
    <html lang={locale}>
      <body className={recursive.className}>
        <LanguageProvider initialLocale={locale}>
          <Navbar />

          <main className='flex grainy-light flex-col min-h-[calc(100vh-3.5rem-1px)]'>
            <div className='flex-1 flex flex-col h-full'>
              <Providers>{children}</Providers>
            </div>
            <Footer />
          </main>

          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  )

  // ClerkProvider throws when no publishable key is present, so it is only
  // mounted when authentication is actually configured.
  if (!isAuthConfigured) return html

  return (
    <ClerkProvider
      localization={locale === 'es' ? esES : enUS}
      appearance={{
        variables: {
          colorPrimary: '#16a34a',
          borderRadius: '0.5rem',
        },
      }}>
      {html}
    </ClerkProvider>
  )
}
