import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const kitInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          productId: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          price: true,
          salePrice: true,
          currency: true,
          category: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { order: 'asc' as const },
  },
}

export async function GET() {
  try {
    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      include: kitInclude,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: kits })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
