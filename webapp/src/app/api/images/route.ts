import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('perPage') || '15'
    const type = searchParams.get('type') || 'search'

    const PEXELS_API_KEY = process.env.PEXELS_API_KEY
    if (!PEXELS_API_KEY) {
      return NextResponse.json({ success: false, error: 'Pexels API not configured' }, { status: 503 })
    }

    let url: string
    if (type === 'curated') {
      url = `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`
    } else {
      if (!query) return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 })
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
    }

    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } })
    const data = await res.json()

    return NextResponse.json({
      success: true,
      data: {
        photos: data.photos.map((p: any) => ({
          id: p.id,
          url: p.src.medium,
          urls: { original: p.src.original, large: p.src.large, medium: p.src.medium, small: p.src.small },
          alt: p.alt,
          photographer: p.photographer,
          photographerUrl: p.photographer_url,
        })),
        page: data.page,
        perPage: data.per_page,
        totalResults: data.total_results,
        hasMore: !!data.next_page,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching images' }, { status: 500 })
  }
}
