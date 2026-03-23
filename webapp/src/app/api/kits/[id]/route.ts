import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const kit = await prisma.kit.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, productId: true, name: true, slug: true,
                description: true, image: true, price: true, salePrice: true,
                currency: true, category: { select: { name: true, slug: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })
    if (!kit) return NextResponse.json({ success: false, error: 'Kit not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: kit })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching kit' }, { status: 500 })
  }
}
