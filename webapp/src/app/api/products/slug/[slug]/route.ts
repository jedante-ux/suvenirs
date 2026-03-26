import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    // Try by slug first, then fallback to productId
    const include = {
      category: { select: { name: true, slug: true, description: true, icon: true } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
      attributes: { orderBy: { sortOrder: 'asc' as const } },
    }
    let product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include,
    })
    if (!product) {
      product = await prisma.product.findFirst({
        where: { productId: slug, isActive: true },
        include,
      })
    }
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching product' }, { status: 500 })
  }
}
