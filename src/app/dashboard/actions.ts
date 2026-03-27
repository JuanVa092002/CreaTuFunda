"use server"

import { db } from '@/db'
import { getSessionUser } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

export const changeOrderStatus = async ({
  id,
  newStatus,
}: {
  id: string
  newStatus: OrderStatus
}) => {
  const user = await getSessionUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!user || !adminEmail || user.email !== adminEmail) {
    throw new Error('Unauthorized')
  }

  await db.order.update({
    where: { id },
    data: { status: newStatus },
  })
}
