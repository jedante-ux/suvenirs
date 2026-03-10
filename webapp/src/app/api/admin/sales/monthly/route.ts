import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const targetYear = Number(searchParams.get('year') || now.getFullYear())
    const targetMonth = Number(searchParams.get('month') || now.getMonth() + 1)

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    const [completedQuotes, allQuotesInMonth] = await Promise.all([
      prisma.quote.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.quote.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    ])

    const totalSales = completedQuotes.length
    const totalUnits = completedQuotes.reduce((sum, q) => sum + q.totalUnits, 0)
    const totalAmount = completedQuotes.reduce((sum, q) => sum + (q.finalAmount || q.quotedAmount || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        year: targetYear, month: targetMonth,
        monthName: startDate.toLocaleDateString('es-CL', { month: 'long' }),
        sales: {
          count: totalSales, totalUnits, totalAmount,
          totalQuotes: allQuotesInMonth,
          conversionRate: allQuotesInMonth > 0 ? ((totalSales / allQuotesInMonth) * 100).toFixed(1) : '0',
        },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching sales' }, { status: 500 })
  }
}
