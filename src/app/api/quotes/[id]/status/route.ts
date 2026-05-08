import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { QuoteStatus } from '@prisma/client'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['PENDING', 'CONTACTED', 'QUOTED', 'APPROVED', 'REJECTED', 'COMPLETED']
    const upperStatus = status?.toUpperCase()

    if (!upperStatus || !validStatuses.includes(upperStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: upperStatus as QuoteStatus },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: quote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error updating status' }, { status: 500 })
  }
}
