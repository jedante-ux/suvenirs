import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
      include: { author: { select: { firstName: true, lastName: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })

    await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } })

    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}
