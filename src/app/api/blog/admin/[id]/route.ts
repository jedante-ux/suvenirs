import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}
