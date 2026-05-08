import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL!

  // Switch to transaction mode pooler (port 6543) for serverless compatibility
  // Session mode (5432) exhausts connections with MaxClientsInSessionMode
  if (connectionString.includes('pooler.supabase.com:5432')) {
    connectionString = connectionString.replace(':5432', ':6543')
  }

  // Strip sslmode from URL to prevent conflict with explicit ssl option.
  // Some hosts (Hostinger LiteSpeed) reject the cert chain when both
  // sslmode in URL AND ssl options coexist.
  const isSupabase = connectionString.includes('supabase.com')
  const cleanedString = connectionString
    .replace(/[?&]sslmode=[^&]+/g, '')
    .replace(/\?$/, '')

  const adapter = new PrismaPg({
    connectionString: cleanedString,
    max: 5,
    idleTimeoutMillis: 20_000,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

// Cache in all environments (critical for Vercel serverless)
globalForPrisma.prisma = prisma

export default prisma
