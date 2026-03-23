import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const kit = await prisma.kit.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, productId: true, name: true, image: true,
                price: true, salePrice: true,
                category: { select: { name: true } },
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { name, description, image, tiers, isActive, order, items } = await req.json()

    const slug = name
      ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : undefined

    const kit = await prisma.$transaction(async (tx) => {
      // Delete existing items and recreate
      await tx.kitItem.deleteMany({ where: { kitId: id } })

      return tx.kit.update({
        where: { id },
        data: {
          ...(name && { name, slug }),
          ...(description !== undefined && { description: description || null }),
          ...(image !== undefined && { image: image || null }),
          ...(tiers && { tiers }),
          ...(isActive !== undefined && { isActive }),
          ...(order !== undefined && { order }),
          ...(items && {
            items: {
              create: items.map((item: { productId: string }, index: number) => ({
                productId: item.productId,
                order: index,
              })),
            },
          }),
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, productId: true, name: true, image: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    return NextResponse.json({ success: true, data: kit })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.kit.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Kit deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting kit' }, { status: 500 })
  }
}
