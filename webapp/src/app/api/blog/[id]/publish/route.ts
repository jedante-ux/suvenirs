import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: !post.isPublished,
        publishedAt: !post.isPublished && !post.publishedAt ? new Date() : post.publishedAt,
      },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: 'Error updating post' }, { status: 500 })
  }
}
