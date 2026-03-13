export interface Category {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  parent?: string | Category;
  parentId?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  categoryId?: string;
  category?: { name: string; slug: string; description?: string; icon?: string | null };
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
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'user';
  isActive: boolean;
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
  quoteNumber: string;
  items: QuoteItem[];
  totalItems: number;
  totalUnits: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  notes?: string;
  status: 'PENDING' | 'CONTACTED' | 'QUOTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  source: 'WHATSAPP' | 'WEB' | 'MANUAL';
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
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  authorId: string;
  author?: User | string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}
