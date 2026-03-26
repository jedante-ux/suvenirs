import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
    })
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.name) {
      body.slug = body.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    // Transform legacy `image` field to `images` array
    if (body.image !== undefined && body.images === undefined) {
      body.images = body.image ? [body.image] : []
      delete body.image
    }
    // Transform `category` slug to `categoryId`
    if (body.category !== undefined) {
      if (body.category) {
        body.categoryId = body.category
      }
      delete body.category
    }
    const product = await prisma.product.update({ where: { id }, data: body })
    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting product' }, { status: 500 })
  }
}
