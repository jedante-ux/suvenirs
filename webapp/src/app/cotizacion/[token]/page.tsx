import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  User,
  Building2,
  Mail,
  Phone,
  Package,
  MessageCircle,
  Calendar,
  Hash,
  Info,
  FileText,
  Boxes,
} from 'lucide-react'
import { company } from '@/config/company'
import { getStatusBadgeClass, getStatusLabel } from '@/lib/statusBadge'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Cotización | Suvenirs',
}

interface QuoteItem {
  id: string
  productId: string
  productName: string
  quantity: number
  description: string
}

interface Quote {
  id: string
  quoteNumber: string
  totalItems: number
  totalUnits: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  notes?: string
  status: string
  source: string
  kit?: { name: string; slug: string } | null
  items: QuoteItem[]
  createdAt: string
}

async function getQuote(token: string): Promise<Quote | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/quotes/public/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    const result = await res.json()
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-pink-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      </div>
    </div>
  )
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await getQuote(token)

  if (!quote) notFound()

  const formattedDate = new Date(quote.createdAt).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const waNumber = company.phone.replace(/\D/g, '')
  const waMessage = encodeURIComponent(
    `Hola, tengo dudas sobre mi cotización ${quote.quoteNumber}. ¿Me pueden ayudar?`
  )
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`

  const hasCustomerInfo =
    quote.customerName || quote.customerCompany || quote.customerEmail || quote.customerPhone

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="h-1 bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600" />

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="Suvenirs"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeClass(quote.status)}`}
          >
            {getStatusLabel(quote.status)}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Quote hero */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 px-6 py-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-pink-100 text-xs font-medium uppercase tracking-widest mb-1">
                  Cotización
                </p>
                <h1 className="text-2xl font-bold tracking-tight">{quote.quoteNumber}</h1>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-pink-400" />
              Emitida el {formattedDate}
            </span>
            {quote.kit && (
              <span className="flex items-center gap-1.5 bg-pink-50 text-pink-600 px-3 py-0.5 rounded-full text-xs font-medium">
                <Boxes className="h-3 w-3" />
                Kit: {quote.kit.name}
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#25D366] hover:bg-[#22c25e] transition-colors rounded-2xl px-5 py-4 shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">¿Tienes dudas?</p>
            <p className="text-white/80 text-xs mt-0.5">
              Escríbenos por WhatsApp y te respondemos de inmediato
            </p>
          </div>
          <svg
            className="h-5 w-5 text-white/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* Customer info */}
        {hasCustomerInfo && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-pink-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quote.customerName && (
                <InfoRow icon={User} label="Nombre" value={quote.customerName} />
              )}
              {quote.customerCompany && (
                <InfoRow icon={Building2} label="Empresa" value={quote.customerCompany} />
              )}
              {quote.customerEmail && (
                <InfoRow icon={Mail} label="Correo electrónico" value={quote.customerEmail} />
              )}
              {quote.customerPhone && (
                <InfoRow icon={Phone} label="Teléfono / WhatsApp" value={quote.customerPhone} />
              )}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-pink-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Productos solicitados</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border rounded-full px-3 py-1">
              {quote.totalItems} producto{quote.totalItems !== 1 ? 's' : ''} · {quote.totalUnits} unidad{quote.totalUnits !== 1 ? 'es' : ''}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {quote.items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wide leading-none mb-0.5">
                    <Hash className="inline h-3 w-3 mr-0.5" />{item.productId}
                  </p>
                  <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Cant.</p>
                  <p className="text-sm font-bold text-gray-900">{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-pink-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Notas</h2>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed pl-9">
              {quote.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-1 pb-6">
          <p className="text-xs text-gray-400">{company.name} · RUT {company.rut}</p>
          <p className="text-xs text-gray-400">{company.address}, {company.city}</p>
          <p className="text-xs text-gray-300 mt-3">
            Este enlace es de uso privado y no está indexado en buscadores.
          </p>
        </div>
      </div>
    </div>
  )
}
