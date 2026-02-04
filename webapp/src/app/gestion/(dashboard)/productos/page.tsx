'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Product, Category } from '@/types';
import { getCategories } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, Search, Star, Upload, Download, X, FolderTree, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ProductFormData {
  productId: string;
  name: string;
  description: string;
  quantity: number;
  price?: number;
  salePrice?: number;
  currency: string;
  image: string;
  category?: string;
  featured: boolean;
  isActive: boolean;
}

const emptyProduct: ProductFormData = {
  productId: '',
  name: '',
  description: '',
  quantity: 0,
  price: undefined,
  salePrice: undefined,
  currency: 'CLP',
  image: '',
  category: undefined,
  featured: false,
  isActive: true,
};

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 50;

export default function ProductosPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  // Applied filters
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Pending filters
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchProducts = async (page = pagination.page) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (search) params.append('search', search);
      if (selectedCategories.length > 0) {
        params.append('category', selectedCategories.join(','));
      }

      const res = await fetch(`${API_URL}/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setProducts(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await getCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (token) {
      fetchProducts(1); // Reset to page 1 when filters change
      fetchCategories();
    }
  }, [token, search, selectedCategories]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setLoading(true);
      fetchProducts(page);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);

    // Extract category ID properly
    let categoryId: string | undefined;
    if (typeof product.category === 'object' && product.category) {
      categoryId = product.category._id;
    } else if (typeof product.category === 'string' && product.category) {
      categoryId = product.category;
    }

    setFormData({
      productId: product.productId,
      name: product.name,
      description: product.description,
      quantity: product.quantity,
      price: product.price,
      salePrice: product.salePrice,
      currency: product.currency || 'CLP',
      image: product.image,
      category: categoryId,
      featured: product.featured,
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingProduct
        ? `${API_URL}/products/${editingProduct._id}`
        : `${API_URL}/products`;

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        setDialogOpen(false);
        fetchProducts();
      } else {
        alert(result.error || 'Error al guardar');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch(`${API_URL}/products/${productToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        alert(result.error || 'Error al eliminar');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      // Extract category ID properly
      let categoryId: string | undefined;
      if (typeof product.category === 'object' && product.category) {
        categoryId = product.category._id;
      } else if (typeof product.category === 'string' && product.category) {
        categoryId = product.category;
      }

      const res = await fetch(`${API_URL}/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.productId,
          name: product.name,
          description: product.description,
          quantity: product.quantity,
          price: product.price,
          salePrice: product.salePrice,
          currency: product.currency,
          image: product.image,
          category: categoryId,
          featured: !product.featured,
          isActive: product.isActive,
        }),
      });

      const result = await res.json();

      if (result.success) {
        fetchProducts();
      } else {
        alert(result.error || 'Error al actualizar');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch(`${API_URL}/admin/products/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        alert(`Importación exitosa: ${result.imported} productos importados`);
        setImportDialogOpen(false);
        setImportFile(null);
        fetchProducts();
      } else {
        alert(result.error || 'Error al importar');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `productId,name,description,quantity,image,category,featured,isActive
PROD-001,Producto Ejemplo,Descripción del producto ejemplo,100,https://ejemplo.com/imagen.jpg,CAT-001,false,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-productos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleApplyFilters = () => {
    setSearch(pendingSearch);
    setSelectedCategories(pendingCategories);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setPendingSearch('');
    setPendingCategories([]);
  };

  const toggleCategory = (categorySlug: string) => {
    const newCategories = pendingCategories.includes(categorySlug)
      ? pendingCategories.filter(c => c !== categorySlug)
      : [...pendingCategories, categorySlug];

    setPendingCategories(newCategories);
  };

  const removeFilter = (type: 'search' | 'category', value?: string) => {
    if (type === 'search') {
      setPendingSearch('');
      setSearch('');
    } else if (type === 'category' && value) {
      const newCategories = pendingCategories.filter(c => c !== value);
      setPendingCategories(newCategories);
      setSelectedCategories(newCategories);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona el catálogo de productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 bg-background p-6 rounded-lg">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              {/* Search bar */}
              <div className="flex-1 min-w-0 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4" />
                  Búsqueda
                </Label>
                <Input
                  type="text"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="Buscar por nombre, ID o descripción..."
                />
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-64 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <FolderTree className="h-4 w-4" />
                  Categoría
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="w-full justify-between">
                      {pendingCategories.length > 0
                        ? `${pendingCategories.length} categoría${pendingCategories.length > 1 ? 's' : ''}`
                        : 'Todas las categorías'}
                      <svg
                        className="ml-2 h-4 w-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>Seleccionar categorías</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {pendingCategories.length > 0 && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setPendingCategories([]);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          Limpiar selección
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {categories.filter(cat => !cat.parent).map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category._id}
                        checked={pendingCategories.includes(category.slug)}
                        onCheckedChange={() => toggleCategory(category.slug)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({category.productCount})
                          </span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search Button */}
              <div className="w-full lg:w-auto">
                <Button
                  onClick={handleApplyFilters}
                  size="lg"
                  className="w-full lg:w-auto px-8"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(pendingSearch || pendingCategories.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>

                {pendingSearch && (
                  <Badge variant="secondary" className="gap-1">
                    Búsqueda: {pendingSearch}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFilter('search')}
                    />
                  </Badge>
                )}

                {pendingCategories.map((categorySlug) => {
                  const category = categories.find(cat => cat.slug === categorySlug);
                  return (
                    <Badge key={categorySlug} variant="secondary" className="gap-1">
                      {category?.name || categorySlug}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeFilter('category', categorySlug)}
                      />
                    </Badge>
                  );
                })}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-6 text-xs"
                >
                  Limpiar todo
                </Button>
              </div>
            )}
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagen</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Destacado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                      <Image
                        src={product.image || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.productId}</TableCell>
                  <TableCell className="font-medium text-xs max-w-48 truncate">{product.name}</TableCell>
                  <TableCell>
                    {typeof product.category === 'object' && product.category ? (
                      <span className="text-xs text-muted-foreground">{product.category.name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin categoría</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.price ? (
                      <div className="space-y-0.5">
                        <span className={`text-sm font-medium ${product.salePrice ? 'line-through text-muted-foreground' : ''}`}>
                          ${product.price.toLocaleString('es-CL')}
                        </span>
                        {product.salePrice && (
                          <div className="text-sm font-medium text-green-600">
                            ${product.salePrice.toLocaleString('es-CL')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin precio</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.quantity > 0 ? 'default' : 'destructive'}>
                      {product.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleFeatured(product)}
                      className="mx-auto"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          product.featured
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => openDeleteDialog(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => goToPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Modifica los datos del producto' : 'Completa los datos para crear un nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">ID del Producto</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                placeholder="PROD-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category || 'none'}
                onValueChange={(value) => setFormData({ ...formData, category: value === 'none' ? undefined : value })}
              >
                <SelectTrigger id="category">
                  <SelectValue>
                    {formData.category
                      ? categories.find(c => c._id === formData.category)?.name || 'Sin categoría'
                      : 'Sin categoría'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Sin categoría</span>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="price">Precio Regular</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ej: 10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio en Oferta (opcional)</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="1"
                value={formData.salePrice || ''}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ej: 8000"
              />
              <p className="text-xs text-muted-foreground">
                Debe ser menor al precio regular
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">URL Imagen</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Producto destacado</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Productos</DialogTitle>
            <DialogDescription>
              Importa productos masivamente desde un archivo CSV o Excel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceptados: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2 text-sm">Formato del archivo</h4>
              <p className="text-xs text-muted-foreground mb-3">
                El archivo debe contener las siguientes columnas:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                <li>• <strong>productId</strong>: ID único del producto (ej: PROD-001)</li>
                <li>• <strong>name</strong>: Nombre del producto</li>
                <li>• <strong>description</strong>: Descripción</li>
                <li>• <strong>quantity</strong>: Stock disponible</li>
                <li>• <strong>image</strong>: URL de la imagen</li>
                <li>• <strong>category</strong>: ID de categoría (ej: CAT-001)</li>
                <li>• <strong>featured</strong>: true/false</li>
                <li>• <strong>isActive</strong>: true/false</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
