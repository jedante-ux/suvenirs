import { Product, Category, PaginatedResponse, ApiResponse } from '@/types';

// Server-side URL (for SSR/Server Components inside Docker)
const SERVER_API_URL = process.env.API_URL || 'http://api:4000/api';
// Client-side URL (for browser)
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Use server URL for server-side fetches
function getApiUrl() {
  if (typeof window === 'undefined') {
    return SERVER_API_URL;
  }
  return CLIENT_API_URL;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  random?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
  if (params?.random !== undefined) queryParams.append('random', params.random.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.order) queryParams.append('order', params.order);

  const url = `${getApiUrl()}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data: PaginatedResponse<Product> = await res.json();
  return data;
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/products/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const data: ApiResponse<Product> = await res.json();
  return data.data;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/products/slug/${slug}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const data: ApiResponse<Product> = await res.json();
  return data.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${getApiUrl()}/categories`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data: ApiResponse<Category[]> = await res.json();
  return data.data;
}
