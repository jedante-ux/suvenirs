import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const quote = await prisma.quote.findUnique({
      where: { publicToken: token },
      include: { items: true, stampingType: true, kit: { select: { name: true, slug: true } } },
    })
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: quote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quote' }, { status: 500 })
  }
}
