import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { tags: true },
    })
    const tags = [...new Set(posts.flatMap(p => p.tags))]
    return NextResponse.json({ success: true, data: tags })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching tags' }, { status: 500 })
  }
}
