import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const products = await prisma.product.findMany({
      where: { productId: { in: ids } },
      select: { productId: true, price: true, salePrice: true },
    })

    const data = products.map((p) => ({
      productId: p.productId,
      price: p.salePrice ?? p.price ?? 0,
    }))

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching prices' }, { status: 500 })
  }
}
