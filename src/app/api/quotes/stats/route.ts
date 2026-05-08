import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const [total, pending, contacted, quoted, approved, completed, rejected] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.count({ where: { status: 'CONTACTED' } }),
      prisma.quote.count({ where: { status: 'QUOTED' } }),
      prisma.quote.count({ where: { status: 'APPROVED' } }),
      prisma.quote.count({ where: { status: 'COMPLETED' } }),
      prisma.quote.count({ where: { status: 'REJECTED' } }),
    ])

    return NextResponse.json({ success: true, data: { total, pending, contacted, quoted, approved, completed, rejected } })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching stats' }, { status: 500 })
  }
}
