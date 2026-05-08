import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const category = await prisma.category.findFirst({ where: { slug, isActive: true } })
    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: category })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching category' }, { status: 500 })
  }
}
