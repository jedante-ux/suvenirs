import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        company: profile.company,
        role: profile.role.toLowerCase(),
        isActive: profile.isActive,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, phone, company } = await req.json()

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: { firstName, lastName, phone, company },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
