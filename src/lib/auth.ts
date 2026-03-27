import { db } from '@/db'

export type SessionUser = {
  id: string
  email: string
}

/**
 * Clerk is optional for this project. When the required environment variables
 * are missing the app keeps rendering, and every authenticated surface falls
 * back to a signed-out state instead of crashing.
 */
export const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
)

/**
 * Reads the Clerk user id from the request session. Returns null when auth is
 * not configured or the session cannot be read.
 */
export async function getSessionUserId(): Promise<string | null> {
  if (!isAuthConfigured) return null

  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    return userId ?? null
  } catch (error) {
    console.error('[auth] unable to read the Clerk session', error)
    return null
  }
}

/**
 * Resolves the signed-in user as `{ id, email }`.
 *
 * Clerk does not put the email in the default session token, so the first time
 * a user is seen we read it from the Backend API and persist a local row. Every
 * later request reads Postgres instead of the rate-limited Backend API, and the
 * row always exists before an Order references it.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId()
  if (!id) return null

  const existing = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  })

  if (existing) return existing

  try {
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()

    if (!clerkUser) return null

    const email =
      clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

    if (!email) return null

    return await db.user.upsert({
      where: { id },
      update: { email },
      create: { id, email },
      select: { id: true, email: true },
    })
  } catch (error) {
    console.error('[auth] unable to provision the local user row', error)
    return null
  }
}
