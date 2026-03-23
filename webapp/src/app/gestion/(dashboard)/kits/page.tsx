'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Kit, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Loader2, Boxes, Search, X, ImageIcon } from 'lucide-react';

const API_URL = '/api';

interface KitFormData {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  order: number;
}

const emptyKit: KitFormData = {
  name: '',
  description: '',
  image: '',
  isActive: true,
  order: 0,
};

export default function KitsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [kitToDelete, setKitToDelete] = useState<Kit | null>(null);
  const [formData, setFormData] = useState<KitFormData>(emptyKit);
  const [saving, setSaving] = useState(false);

  // Product search within dialog
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const fetchKits = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/kits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setKits(result.data);
      }
    } catch (error) {
      console.error('Error fetching kits:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchKits();
    }
  }, [authLoading, token, fetchKits]);

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/products?search=${encodeURIComponent(query)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.success) {
        // Filter out already selected products
        const selectedIds = new Set(selectedProducts.map((p) => p.id));
        setProductResults(result.data.filter((p: Product) => !selectedIds.has(p.id)));
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearchingProducts(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [productSearch, selectedProducts]);

  const addProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
    setProductSearch('');
    setProductResults([]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const openCreateDialog = () => {
    setEditingKit(null);
    setFormData(emptyKit);
    setSelectedProducts([]);
    setProductSearch('');
    setProductResults([]);
    setDialogOpen(true);
  };

  const openEditDialog = (kit: Kit) => {
    setEditingKit(kit);
    setFormData({
      name: kit.name,
      description: kit.description || '',
      image: kit.image || '',
      isActive: kit.isActive,
      order: kit.order,
    });
    setSelectedProducts(kit.items.map((item) => item.product));
    setProductSearch('');
    setProductResults([]);
    setDialogOpen(true);
  };

  const openDeleteDialog = (kit: Kit) => {
    setKitToDelete(kit);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert('Debes agregar al menos un producto al kit');
      return;
    }
    setSaving(true);

    try {
      const url = editingKit
        ? `${API_URL}/admin/kits/${editingKit.id}`
        : `${API_URL}/admin/kits`;

      const method = editingKit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          items: selectedProducts.map((p) => ({ productId: p.id })),
        }),
      });

      const result = await res.json();

      if (result.success) {
        await fetchKits();
        setDialogOpen(false);
        setFormData(emptyKit);
        setSelectedProducts([]);
      } else {
        alert(result.error || 'Error al guardar el kit');
      }
    } catch (error) {
      console.error('Error saving kit:', error);
      alert('Error al guardar el kit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!kitToDelete) return;

    try {
      const res = await fetch(`${API_URL}/admin/kits/${kitToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        await fetchKits();
        setDeleteDialogOpen(false);
        setKitToDelete(null);
      } else {
        alert(result.error || 'Error al eliminar el kit');
      }
    } catch (error) {
      console.error('Error deleting kit:', error);
      alert('Error al eliminar el kit');
    }
  };

  const filteredKits = kits.filter((kit) =>
    kit.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kits Corporativos</h1>
          <p className="text-muted-foreground">Administra los kits de productos pre-armados</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Kit
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Kits Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] px-2">Imagen</TableHead>
                <TableHead className="px-2">Nombre</TableHead>
                <TableHead className="text-center w-[120px] px-2">Productos</TableHead>
                <TableHead className="text-center w-[180px] px-2">Tiers</TableHead>
                <TableHead className="text-center w-[60px] px-2">Orden</TableHead>
                <TableHead className="text-center w-[80px] px-2">Estado</TableHead>
                <TableHead className="text-right w-[100px] px-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredKits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell className="px-2 py-2">
                        {kit.image ? (
                          <img
                            src={kit.image}
                            alt={kit.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Boxes className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium px-2 py-2">
                        <div>
                          <span>{kit.name}</span>
                          {kit.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {kit.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {kit.items.length} productos
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {kit.tiers.map((tier) => (
                            <Badge key={tier} variant="secondary" className="text-xs">
                              {tier} uds
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <Badge variant="secondary" className="text-xs">
                          {kit.order}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <Badge
                          variant={kit.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {kit.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEditDialog(kit)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => openDeleteDialog(kit)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredKits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Boxes className="h-8 w-8 opacity-30" />
                          <p className="text-sm">No se encontraron kits</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKit ? 'Editar Kit' : 'Nuevo Kit'}</DialogTitle>
            <DialogDescription>
              {editingKit
                ? 'Actualiza la información del kit'
                : 'Completa los datos para crear un nuevo kit corporativo'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Kit</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Kit Welcome, Kit Executive..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del kit..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL Imagen (Opcional)</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Orden de visualización</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Estado Activo</Label>
                <p className="text-sm text-muted-foreground">
                  Kits activos son visibles en el catálogo público
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {/* Product Selector */}
            <div className="space-y-3">
              <Label>Productos del Kit</Label>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar productos por nombre o código..."
                  className="pl-9"
                />
                {searchingProducts && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search results dropdown */}
              {productResults.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                  {productResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => addProduct(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.productId}
                          {product.category ? ` · ${product.category.name}` : ''}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected products list */}
              {selectedProducts.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {selectedProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-2">
                      <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                        {index + 1}
                      </span>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.productId}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                  Busca y agrega productos al kit
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>{editingKit ? 'Actualizar' : 'Crear'} Kit</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Kit</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el kit &quot;{kitToDelete?.name}&quot;? Esta
              acción no se puede deshacer.
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
    </div>
  );
}
