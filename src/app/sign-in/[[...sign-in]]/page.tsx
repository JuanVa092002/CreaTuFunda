import { SignIn } from '@clerk/nextjs'
import { Suspense } from 'react'
import { isAuthConfigured } from '@/lib/auth'

export default function Page() {
  if (!isAuthConfigured) {
    return (
      <div className='flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4'>
        <p className='max-w-md text-center text-sm text-zinc-600'>
          Authentication is not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          and CLERK_SECRET_KEY to enable sign in.
        </p>
      </div>
    )
  }

  return (
    <div className='flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12'>
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </div>
  )
}
