import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    // Add sample product image if category has no image
    const result = await Promise.all(
      categories.map(async (cat) => {
        if (cat.image) return cat
        const product = await prisma.product.findFirst({
          where: { categoryId: cat.id, isActive: true },
          select: { image: true },
          orderBy: { createdAt: 'desc' },
        })
        return { ...cat, image: product?.image || null }
      })
    )

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Auto-generate categoryId
    const last = await prisma.category.findFirst({ orderBy: { categoryId: 'desc' } })
    const lastNum = last ? parseInt(last.categoryId.replace('CAT-', '')) || 0 : 0
    const categoryId = `CAT-${String(lastNum + 1).padStart(3, '0')}`

    const category = await prisma.category.create({
      data: { ...body, slug, categoryId, parentId: body.parentId || null },
    })
    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
