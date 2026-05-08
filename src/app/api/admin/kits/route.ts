import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const kits = await prisma.kit.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, productId: true, name: true, images: true,
                price: true, salePrice: true,
                category: { select: { name: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: kits })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description, image, tiers, isActive, order, items } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one product is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const kit = await prisma.kit.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        tiers: tiers || [50, 100, 200],
        isActive: isActive ?? true,
        order: order ?? 0,
        items: {
          create: items.map((item: { productId: string }, index: number) => ({
            productId: item.productId,
            order: index,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, productId: true, name: true, images: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: kit }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
