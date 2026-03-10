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
    if (lines.length < 2) return NextResponse.json({ success: false, error: 'Empty file' }, { status: 400 })

    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase())

    const idIdx = headers.findIndex(h => ['productid', 'codigo', 'id', 'product_id', 'sku'].includes(h))
    const priceIdx = headers.findIndex(h => ['price', 'precio', 'valor', 'monto', 'price_clp'].includes(h))
    const saleIdx = headers.findIndex(h => ['saleprice', 'sale_price', 'precio_oferta', 'descuento'].includes(h))

    if (idIdx === -1) return NextResponse.json({ success: false, error: 'Missing productId column' }, { status: 400 })
    if (priceIdx === -1) return NextResponse.json({ success: false, error: 'Missing price column' }, { status: 400 })

    let updated = 0, notFound = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(sep).map(v => v.trim())
        const productId = values[idIdx]
        const priceStr = values[priceIdx]
        if (!productId || !priceStr) continue

        const price = parseFloat(priceStr.replace(/[$.\s]/g, '').replace(',', '.'))
        if (isNaN(price) || price < 0) { errors.push(`Row ${i + 1}: Invalid price`); continue }

        const saleStr = saleIdx !== -1 ? values[saleIdx] : null
        let salePrice: number | undefined
        if (saleStr) {
          salePrice = parseFloat(saleStr.replace(/[$.\s]/g, '').replace(',', '.'))
          if (isNaN(salePrice) || salePrice >= price) salePrice = undefined
        }

        const product = await prisma.product.findFirst({ where: { productId } })
        if (product) {
          await prisma.product.update({
            where: { id: product.id },
            data: { price, ...(salePrice !== undefined ? { salePrice } : {}) },
          })
          updated++
        } else {
          notFound++
          errors.push(`Row ${i + 1}: Product "${productId}" not found`)
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true, updated, notFound,
      errors: errors.slice(0, 20),
      message: `${updated} prices updated, ${notFound} not found`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
