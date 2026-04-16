import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const banners = await prisma.siteBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ success: true, data: banners })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching banners' }, { status: 500 })
  }
}
