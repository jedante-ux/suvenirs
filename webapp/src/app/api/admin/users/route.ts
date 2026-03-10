import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const role = searchParams.get('role')
    const search = searchParams.get('search') || ''
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProfileWhereInput = {}

    if (role) where.role = role.toUpperCase() as Role
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.profile.findMany({ where, orderBy: { createdAt: order }, skip, take: limit }),
      prisma.profile.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, password, firstName, lastName, phone, company, role } = await req.json()
    const supabaseAdmin = await createAdminClient()

    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })

    const profile = await prisma.profile.create({
      data: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
        phone,
        company,
        role: (role?.toUpperCase() || 'USER') as Role,
      },
    })

    return NextResponse.json({ success: true, data: profile }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
