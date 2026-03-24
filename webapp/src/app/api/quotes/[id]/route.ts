import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true, stampingType: true } })
    if (!quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: quote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quote' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { items, ...fields } = await req.json()

    const activeItems = items?.filter((i: { outOfStock?: boolean }) => !i.outOfStock) ?? [];
    const totalItems = items ? activeItems.length : undefined;
    const totalUnits = items ? activeItems.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) : undefined;

    const quote = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.quoteItem.deleteMany({ where: { quoteId: id } })
      }
      return tx.quote.update({
        where: { id },
        data: {
          ...fields,
          ...(totalItems !== undefined && { totalItems, totalUnits }),
          ...(items && {
            items: {
              create: items.map((item: { productId: string; productName: string; quantity: number; unitPrice?: number; description?: string; outOfStock?: boolean; replacesItemId?: string | null }) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? 0,
                description: item.description || '',
                outOfStock: item.outOfStock ?? false,
                replacesItemId: item.replacesItemId ?? null,
              })),
            },
          }),
        },
        include: { items: true, stampingType: true },
      })
    })

    return NextResponse.json({ success: true, data: quote })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.quote.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Quote deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting quote' }, { status: 500 })
  }
}
