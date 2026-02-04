'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { getCategories } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Grid3X3, FolderOpen } from 'lucide-react';

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // Filter only active categories
        const activeCategories = data.filter(cat => cat.isActive);
        setCategories(activeCategories);
        setFilteredCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower)
      );
      setFilteredCategories(filtered);
    }
  }, [search, categories]);

  return (
    <div className="min-h-screen bg-gray-50 py-[100px]">
      {/* Header */}
      <div className="container mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Grid3X3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Categorías</h1>
        </div>
        <p className="text-muted-foreground">
          Explora nuestro catálogo por categorías para encontrar lo que buscas
        </p>
      </div>

      {/* Search */}
      <div className="container mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">
              {search ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'categoría encontrada' : 'categorías encontradas'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/productos?categoria=${category.slug}`}
                >
                  <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg h-full cursor-pointer p-0 gap-0">
                    <div className="relative aspect-square bg-[#f5f5f5] p-3 rounded-t-xl">
                      <div className="relative w-full h-full overflow-hidden rounded-lg">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.productCount > 0 && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
