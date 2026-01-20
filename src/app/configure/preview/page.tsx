import { db } from '@/db'
import { getSessionUser, isAuthConfigured } from '@/lib/auth'
import { isPaymentsEnabled } from '@/lib/stripe'
import { getWompiUsdToCopRate, isWompiEnabled } from '@/lib/wompi'
import { notFound } from 'next/navigation'
import DesignPreview from './DesignPreview'

interface PageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

const Page = async ({ searchParams }: PageProps) => {
  const { id } = await searchParams

  if (!id || typeof id !== 'string') {
    return notFound()
  }

  const configuration = await db.configuration.findUnique({
    where: { id },
  })

  if (!configuration) {
    return notFound()
  }

  const user = await getSessionUser()

  return (
    <DesignPreview
      configuration={configuration}
      user={user}
      authEnabled={isAuthConfigured}
      paymentsEnabled={isPaymentsEnabled()}
      wompiEnabled={isWompiEnabled()}
      usdToCopRate={getWompiUsdToCopRate()}
    />
  )
}

export default Page
