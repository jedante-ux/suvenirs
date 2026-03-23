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

export interface KitItem {
  id: string;
  kitId: string;
  productId: string;
  product: Product;
  order: number;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  tiers: number[];
  isActive: boolean;
  order: number;
  items: KitItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StampingType {
  id: string;
  code: string;
  name: string;
  price: number;
  minUnits: number | null;
  maxUnits: number | null;
  isActive: boolean;
}

export interface QuoteItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  publicToken: string;
  items: QuoteItem[];
  totalItems: number;
  totalUnits: number;
  quotedAmount: number;
  finalAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  notes?: string;
  shippingService?: string | null;
  shippingPrice: number;
  stampingTypeId?: string | null;
  stampingType?: StampingType | null;
  stampingPrice: number;
  status: 'PENDING' | 'CONTACTED' | 'QUOTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  source: 'WHATSAPP' | 'WEB' | 'MANUAL' | 'KIT';
  kitId?: string | null;
  kit?: { name: string; slug: string } | null;
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
