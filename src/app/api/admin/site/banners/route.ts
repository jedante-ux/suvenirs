import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const banners = await prisma.siteBanner.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json({ success: true, data: banners })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching banners' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string) || ''
    const linkUrl = (formData.get('linkUrl') as string) || null

    let imageUrl = ''

    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `banner-${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, buffer, { contentType: file.type, upsert: true })

      if (uploadError) {
        return NextResponse.json({ success: false, error: uploadError.message }, { status: 400 })
      }

      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    } else {
      imageUrl = (formData.get('imageUrl') as string) || ''
    }

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Image is required' }, { status: 400 })
    }

    const maxOrder = await prisma.siteBanner.aggregate({ _max: { order: true } })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const banner = await prisma.siteBanner.create({
      data: { imageUrl, alt, linkUrl, order: nextOrder, isActive: true },
    })

    return NextResponse.json({ success: true, data: banner }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { id, alt, linkUrl, isActive } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const banner = await prisma.siteBanner.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ success: true, data: banner })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const banner = await prisma.siteBanner.findUnique({ where: { id } })
    if (!banner) return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 })

    // Delete from storage if Supabase URL
    if (banner.imageUrl.includes('supabase')) {
      const path = banner.imageUrl.split('/banners/').pop()
      if (path) await supabase.storage.from('banners').remove([path])
    }

    await prisma.siteBanner.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
