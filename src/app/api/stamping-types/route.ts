import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const types = await prisma.stampingType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, data: types })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching stamping types' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const type = await prisma.stampingType.create({ data: body })
    return NextResponse.json({ success: true, data: type }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
