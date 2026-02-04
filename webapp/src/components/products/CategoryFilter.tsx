'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Folder } from 'lucide-react';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await getCategories();
        // Filter root categories only (no parent)
        const rootCategories = allCategories.filter(cat => !cat.parent);
        setCategories(rootCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando categorías...</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="category-select" className="flex items-center gap-2 text-sm font-medium">
        <Folder className="h-4 w-4 text-muted-foreground" />
        Categoría
      </Label>
      <Select
        value={selectedCategory || 'all'}
        onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
      >
        <SelectTrigger id="category-select" className="w-full sm:w-[280px]">
          <SelectValue placeholder="Seleccionar categoría..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-medium">Todas las categorías</span>
          </SelectItem>
          {categories.map((category) => (
            <SelectItem key={category._id} value={category.slug}>
              <div className="flex items-center justify-between w-full gap-2">
                <span>{category.name}</span>
                {category.productCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({category.productCount})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
