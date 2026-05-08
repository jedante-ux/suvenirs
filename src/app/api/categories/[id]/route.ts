import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: category })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching category' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    const category = await prisma.category.update({
      where: { id },
      data: { ...body, parentId: body.parentId || null },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const productsCount = await prisma.product.count({ where: { categoryId: id } })
    if (productsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${productsCount} products` },
        { status: 400 }
      )
    }

    const childCount = await prisma.category.count({ where: { parentId: id } })
    if (childCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${childCount} sub-categories` },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting category' }, { status: 500 })
  }
}
