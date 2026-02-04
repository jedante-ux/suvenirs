'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';
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
import { Plus, Pencil, Trash2, Loader2, Search, FolderTree } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface CategoryFormData {
  categoryId: string;
  name: string;
  description: string;
  slug: string;
  parent?: string;
  order: number;
  isActive: boolean;
  image?: string;
  icon?: string;
}

const emptyCategory: CategoryFormData = {
  categoryId: '',
  name: '',
  description: '',
  slug: '',
  parent: undefined,
  order: 0,
  isActive: true,
  image: '',
  icon: '',
};

export default function CategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnlyParents, setShowOnlyParents] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyCategory);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token, search]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData(emptyCategory);
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      slug: category.slug,
      parent: typeof category.parent === 'object' && category.parent ? category.parent._id : category.parent,
      order: category.order,
      isActive: category.isActive,
      image: category.image || '',
      icon: category.icon || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory
        ? `${API_URL}/admin/categories/${editingCategory._id}`
        : `${API_URL}/admin/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      // Clean up the data - remove empty parent and categoryId for new categories
      const submitData: any = {
        ...formData,
        parent: formData.parent && formData.parent !== 'none' ? formData.parent : undefined,
      };

      // Don't send categoryId when creating a new category (it will be auto-generated)
      if (!editingCategory) {
        delete submitData.categoryId;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (result.success) {
        await fetchCategories();
        setDialogOpen(false);
        setFormData(emptyCategory);
      } else {
        alert(result.error || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`${API_URL}/admin/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        await fetchCategories();
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } else {
        alert(result.error || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const filteredCategories = categories.filter(
    (category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.categoryId.toLowerCase().includes(search.toLowerCase());

      const matchesParentFilter = !showOnlyParents || !category.parent;

      return matchesSearch && matchesParentFilter;
    }
  );

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parent);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId || cat.categoryId === categoryId);
    return category?.name || 'Sin categoría padre';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
          <p className="text-muted-foreground">Administra las categorías de productos</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Switch
            id="show-parents"
            checked={showOnlyParents}
            onCheckedChange={setShowOnlyParents}
          />
          <Label htmlFor="show-parents" className="cursor-pointer">
            Solo categorías padre
          </Label>
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] px-2">ID</TableHead>
                <TableHead className="w-[160px] px-2">Nombre</TableHead>
                <TableHead className="w-[150px] px-2">Slug</TableHead>
                {!showOnlyParents && (
                  <TableHead className="w-[150px] px-2">Categoría Padre</TableHead>
                )}
                <TableHead className="text-center w-[80px] px-2">Productos</TableHead>
                <TableHead className="text-center w-[60px] px-2">Orden</TableHead>
                <TableHead className="text-center w-[80px] px-2">Estado</TableHead>
                <TableHead className="text-right w-[100px] px-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showOnlyParents ? 7 : 8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-mono text-xs px-2 py-2">{category.categoryId}</TableCell>
                      <TableCell className="font-medium px-2 py-2">
                        <div className="flex items-center gap-1">
                          <FolderTree className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground px-2 py-2 truncate">{category.slug}</TableCell>
                      {!showOnlyParents && (
                        <TableCell className="px-2 py-2">
                          {typeof category.parent === 'object' && category.parent ? (
                            <span className="text-sm text-muted-foreground truncate block">{category.parent.name}</span>
                          ) : category.parent ? (
                            <span className="text-sm text-muted-foreground truncate block">{getCategoryName(category.parent)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin categoría padre</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-center px-2 py-2">
                        <Badge variant="outline" className="text-xs">{category.productCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <Badge variant="secondary" className="text-xs">{category.order}</Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 py-2">
                        <Badge variant={category.isActive ? 'default' : 'secondary'} className="text-xs">
                          {category.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(category)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeleteDialog(category)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showOnlyParents ? 7 : 8} className="text-center py-8 text-muted-foreground">
                        No se encontraron categorías
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
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Actualiza la información de la categoría'
                : 'Completa los datos para crear una nueva categoría'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">ID de la Categoría</Label>
                <Input
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="CAT-001"
                  disabled
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="nombre-de-la-categoria"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la categoría"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Categoría Padre (Opcional)</Label>
              <Select
                value={formData.parent || 'none'}
                onValueChange={(value) => setFormData({ ...formData, parent: value === 'none' ? undefined : value })}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Seleccionar categoría padre..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Sin categoría padre</span>
                  </SelectItem>
                  {getParentCategories().map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Estado Activo</Label>
                <p className="text-sm text-muted-foreground">
                  Categorías activas son visibles en el catálogo
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
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
                  <>{editingCategory ? 'Actualizar' : 'Crear'} Categoría</>
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
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría &quot;{categoryToDelete?.name}&quot;?
              Esta acción no se puede deshacer.
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
