import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

/**
 * Neon's Postgres wire protocol is not reachable from every network, but its
 * WebSocket proxy runs over HTTPS (port 443). The Prisma driver adapter uses
 * that path, so the app can reach Neon from local machines and serverless
 * environments alike without changing the database or the schema.
 */
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured')
}

const adapter = new PrismaNeon({ connectionString })

declare global {
  var cachedPrisma: PrismaClient
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter })
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({ adapter })
  }

  prisma = global.cachedPrisma
}

export const db = prisma
