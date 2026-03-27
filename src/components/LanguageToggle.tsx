'use client'

import { Globe } from 'lucide-react'
import { useLocale } from './LanguageContext'
import { cn } from '@/lib/utils'

const LanguageToggle = () => {
  const { locale, setLocale } = useLocale()

  return (
    <div
      role='group'
      aria-label='Idioma / Language'
      className='inline-flex items-center rounded-md border border-zinc-200 bg-white/80 p-0.5 text-xs font-medium'>
      <Globe className='ml-1.5 mr-1 h-3.5 w-3.5 text-zinc-500 hidden sm:inline' />
      <button
        type='button'
        onClick={() => setLocale('es')}
        className={cn(
          'rounded px-2 py-1 transition-colors',
          locale === 'es'
            ? 'bg-green-600 text-white'
            : 'text-zinc-600 hover:text-zinc-900'
        )}>
        ES
      </button>
      <button
        type='button'
        onClick={() => setLocale('en')}
        className={cn(
          'rounded px-2 py-1 transition-colors',
          locale === 'en'
            ? 'bg-green-600 text-white'
            : 'text-zinc-600 hover:text-zinc-900'
        )}>
        EN
      </button>
    </div>
  )
}

export default LanguageToggle
