import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
)

/**
 * `clerkMiddleware()` is the piece that makes `auth()` available to Server
 * Components, Route Handlers and Server Actions. Without Clerk keys we fall
 * back to a no-op middleware so the store keeps working unauthenticated.
 */
const clerk = isAuthConfigured ? clerkMiddleware() : null

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerk) return NextResponse.next()

  return clerk(request, event)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
