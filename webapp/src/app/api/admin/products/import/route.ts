import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const fileContent = await file.text()
    const lines = fileContent.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: 'File is empty or has no data rows' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const required = ['productId', 'name', 'description', 'quantity', 'image']
    const missing = required.filter(h => !headers.includes(h))

    if (missing.length > 0) {
      return NextResponse.json({ success: false, error: `Missing columns: ${missing.join(', ')}` }, { status: 400 })
    }

    let imported = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })

        let categoryId: string | null = null
        if (row.category) {
          const cat = await prisma.category.findFirst({ where: { categoryId: row.category } })
          if (cat) categoryId = cat.id
        }

        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const existing = await prisma.product.findFirst({ where: { productId: row.productId } })

        const data: any = {
          name: row.name,
          description: row.description,
          quantity: parseInt(row.quantity) || 0,
          image: row.image,
          categoryId,
          featured: row.featured === 'true',
          isActive: row.isActive !== 'false',
        }
        if (row.price) {
          const price = parseFloat(row.price.replace(/[$.\s]/g, '').replace(',', '.'))
          if (!isNaN(price)) data.price = price
        }

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data })
        } else {
          await prisma.product.create({ data: { ...data, productId: row.productId, slug } })
        }
        imported++
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true, imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported} products imported${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
