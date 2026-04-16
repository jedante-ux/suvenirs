import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ success: true, data: map })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching settings' }, { status: 500 })
  }
}
