import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }
    const quote = await prisma.quote.findUnique({
      where: { publicToken: token },
      include: { items: true, stampingType: true, kit: { select: { name: true, slug: true } } },
    })
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }
    // Filter out-of-stock items from public view — replacements appear as normal items
    const filteredQuote = {
      ...quote,
      items: quote.items.filter(item => !item.outOfStock),
    }
    return NextResponse.json({ success: true, data: filteredQuote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quote' }, { status: 500 })
  }
}
