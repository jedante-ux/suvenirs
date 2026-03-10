import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const user = await prisma.profile.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { firstName, lastName, phone, company, role, isActive } = await req.json()

    const user = await prisma.profile.update({
      where: { id },
      data: {
        firstName, lastName, phone, company, isActive,
        ...(role ? { role: role.toUpperCase() as Role } : {}),
      },
    })
    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const supabaseAdmin = await createAdminClient()

    await prisma.profile.delete({ where: { id } })
    await supabaseAdmin.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting user' }, { status: 500 })
  }
}
