import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, QuoteStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerEmail, customerPhone, customerCompany, notes, source, shippingService } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required' }, { status: 400 })
    }

    const totalItems = items.length
    const totalUnits = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)

    // Fetch product prices from DB
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, price: true, salePrice: true },
    })
    const priceMap = new Map(products.map((p) => [p.productId, p.salePrice ?? p.price ?? 0]))

    const count = await prisma.quote.count()
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const quoteNumber = `COT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        totalItems,
        totalUnits,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        notes,
        shippingService: shippingService || null,
        source: (source?.toUpperCase() || 'WEB') as any,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.productId) ?? 0,
            description: item.description || '',
          })),
        },
      },
      include: { items: true, stampingType: true },
    })

    return NextResponse.json({ success: true, data: quote }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const status = searchParams.get('status')
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.QuoteWhereInput = {}
    if (status) where.status = status.toUpperCase() as QuoteStatus

    const skip = (page - 1) * limit

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { items: true, stampingType: true },
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: quotes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quotes' }, { status: 500 })
  }
}
