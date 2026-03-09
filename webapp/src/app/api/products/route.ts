import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 12)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured')
    const random = searchParams.get('random')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProductWhereInput = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (featured === 'true') where.featured = true

    if (category) {
      const slugs = category.split(',').map(s => s.trim())
      const cats = await prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: { id: true },
      })
      if (cats.length > 0) {
        where.categoryId = { in: cats.map(c => c.id) }
      }
    }

    if (random === 'true') {
      const count = await prisma.product.count({ where })
      const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, count - limit)))
      const products = await prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
        take: limit,
        skip,
      })
      return NextResponse.json({
        success: true,
        data: products,
        pagination: { page: 1, limit, total: products.length, totalPages: 1 },
      })
    }

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order } as Prisma.ProductOrderByWithRelationInput

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
        orderBy,
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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const product = await prisma.product.create({ data: { ...body, slug } })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
