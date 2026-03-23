import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const [totalProducts, activeProducts, featuredProducts, outOfStockProducts,
           totalUsers, totalQuotes, pendingQuotes, recentQuotes] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { quantity: 0 } }),
      prisma.profile.count(),
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { items: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        products: { total: totalProducts, active: activeProducts, featured: featuredProducts, outOfStock: outOfStockProducts },
        users: { total: totalUsers },
        quotes: { total: totalQuotes, pending: pendingQuotes, recent: recentQuotes },
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
