export interface Category {
  _id: string;
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  parent?: string | Category;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  _id: string; // Mantener temporalmente para compatibilidad
  productId: string;
  name: string;
  slug: string;
  description: string;
  category?: string | Category;
  quantity: number;
  price?: number;
  salePrice?: number;
  currency: string;
  image: string;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  description: string;
}

export interface Quote {
  id: string;
  _id: string; // Mantener temporalmente para compatibilidad
  quoteNumber: string;
  items: QuoteItem[];
  totalItems: number;
  totalUnits: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'quoted' | 'approved' | 'rejected' | 'completed';
  source: 'whatsapp' | 'web' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface BlogPost {
  id: string;
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: User | string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}
