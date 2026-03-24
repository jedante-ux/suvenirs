'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { getCategories } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FolderOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary pt-28 pb-14 px-4">
        <div className="container">
          <div className="flex flex-col items-center text-center gap-4">
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
              Explora
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Nuestras Categorías
            </h1>
            <p className="text-white/80 text-lg max-w-xl">
              Todo lo que necesitas para sorprender, organizado para que lo encuentres al instante.
            </p>
            {/* Search inside hero */}
            <div className="relative max-w-md w-full mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorías..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/95 border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container py-10">
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
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-accent text-accent-foreground font-bold text-xs px-2 py-0.5 rounded-full">
                  {filteredCategories.length}
                </span>
                {filteredCategories.length === 1 ? 'categoría encontrada' : 'categorías encontradas'}
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/productos?categoria=${category.slug}`}
                >
                  <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] h-full cursor-pointer p-0 gap-0 border-0 shadow-md">
                    <div className="relative aspect-square bg-[#f5f5f5] p-3 rounded-t-xl overflow-hidden">
                      <div className="relative w-full h-full overflow-hidden rounded-lg">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Pink gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.productCount > 0 && (
                        <Badge className="mt-2 text-xs bg-accent text-accent-foreground hover:bg-accent/90 border-0">
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
