import { Product, Category, Kit, PaginatedResponse, ApiResponse } from '@/types'

function getApiUrl() {
  if (typeof window === 'undefined') {
    // Server-side: use absolute URL for fetch
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  // Client-side: relative URL works
  return ''
}

export interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  featured?: boolean
  random?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export async function getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
  const queryParams = new URLSearchParams()

  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.category) queryParams.append('category', params.category)
  if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString())
  if (params?.random !== undefined) queryParams.append('random', params.random.toString())
  if (params?.sort) queryParams.append('sort', params.sort)
  if (params?.order) queryParams.append('order', params.order)

  const url = `${getApiUrl()}/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) throw new Error('Failed to fetch products')

  return res.json()
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/slug/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${getApiUrl()}/api/categories`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data: ApiResponse<Category[]> = await res.json()
  return data.data
}

export async function getKits(): Promise<Kit[]> {
  const res = await fetch(`${getApiUrl()}/api/kits`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch kits')
  const data: ApiResponse<Kit[]> = await res.json()
  return data.data
}

export async function getKitBySlug(slug: string): Promise<Kit | null> {
  const res = await fetch(`${getApiUrl()}/api/kits/slug/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data: ApiResponse<Kit> = await res.json()
  return data.data
}
