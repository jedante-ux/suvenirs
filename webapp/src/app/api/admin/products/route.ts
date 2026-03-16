import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured')
    const isActive = searchParams.get('isActive')
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProductWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      const slugs = category.split(',').map(s => s.trim())
      const cats = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true } })
      if (cats.length > 0) where.categoryId = { in: cats.map(c => c.id) }
    }

    if (featured !== null && featured !== undefined && featured !== '') where.featured = featured === 'true'
    if (isActive !== null && isActive !== undefined && isActive !== '') where.isActive = isActive === 'true'

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching products' }, { status: 500 })
  }
}
