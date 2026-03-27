'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  getMessages,
  LOCALE_COOKIE,
  type Locale,
} from '@/lib/i18n'

type LanguageContextValue = {
  locale: Locale
  t: ReturnType<typeof getMessages>
  setLocale: (next: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: getMessages(DEFAULT_LOCALE),
  setLocale: () => {},
})

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  useEffect(() => {
    setLocaleState(initialLocale)
  }, [initialLocale])

  const setLocale = (next: Locale) => {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    setLocaleState(next)
    router.refresh()
  }

  return (
    <LanguageContext.Provider
      value={{ locale, t: getMessages(locale), setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLocale() {
  return useContext(LanguageContext)
}
