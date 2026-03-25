import { Product, Category, Kit, PaginatedResponse, ApiResponse } from '@/types'

function getApiUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  return ''
}

// Server: revalidate cache. Client: no-store (next options don't work in browser)
function fetchOptions(revalidate: number): RequestInit {
  if (typeof window === 'undefined') {
    return { next: { revalidate } } as RequestInit
  }
  return { cache: 'no-store' }
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

  const res = await fetch(url, fetchOptions(60))

  if (!res.ok) throw new Error('Failed to fetch products')

  return res.json()
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`, fetchOptions(60))
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/slug/${slug}`, fetchOptions(60))
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${getApiUrl()}/api/categories`, fetchOptions(120))
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data: ApiResponse<Category[]> = await res.json()
  return data.data
}

export async function getKits(): Promise<Kit[]> {
  const res = await fetch(`${getApiUrl()}/api/kits`, fetchOptions(120))
  if (!res.ok) throw new Error('Failed to fetch kits')
  const data: ApiResponse<Kit[]> = await res.json()
  return data.data
}

export async function getKitBySlug(slug: string): Promise<Kit | null> {
  const res = await fetch(`${getApiUrl()}/api/kits/slug/${slug}`, fetchOptions(120))
  if (!res.ok) return null
  const data: ApiResponse<Kit> = await res.json()
  return data.data
}
