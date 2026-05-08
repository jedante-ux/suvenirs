import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await prisma.blogPost.findFirst({
      where: { id, isPublished: true },
      include: { author: { select: { firstName: true, lastName: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.title) {
      body.slug = body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    const post = await prisma.blogPost.update({
      where: { id },
      data: body,
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })
    return NextResponse.json({ success: true, data: post })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Post deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting post' }, { status: 500 })
  }
}
