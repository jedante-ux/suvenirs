'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, GetProductsParams, getCategories } from '@/lib/api';
import { addSearchToHistory } from '@/lib/searchHistory';
import { Product, Category, PaginatedResponse } from '@/types';
import { getCategoryDisplayName } from '@/lib/categoryDisplayNames';
import ProductList from '@/components/products/ProductList';
import SearchBar from '@/components/products/SearchBar';
import ProductFilters, { FilterOptions } from '@/components/products/ProductFilters';
import CategoryFilter from '@/components/products/CategoryFilter';
import ActiveFilters, { ActiveFilter } from '@/components/products/ActiveFilters';
import Pagination, { PaginationInfo } from '@/components/products/Pagination';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpDown, Search, FolderTree, PackageOpen, MessageSquareQuote } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function ProductosContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || searchParams.get('categoria');
  const searchFromUrl = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Applied filters (used for fetching)
  const [search, setSearch] = useState(searchFromUrl);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryFromUrl ? [categoryFromUrl] : []
  );
  const [filters, setFilters] = useState<FilterOptions>({
    sort: 'createdAt',
    order: 'desc',
  });

  // Pending filters (not applied until "Buscar" is clicked)
  const [pendingSearch, setPendingSearch] = useState(searchFromUrl);
  const [pendingCategories, setPendingCategories] = useState<string[]>(
    categoryFromUrl ? [categoryFromUrl] : []
  );
  const [pendingFilters, setPendingFilters] = useState<FilterOptions>({
    sort: 'createdAt',
    order: 'desc',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCategoryApplied, setInitialCategoryApplied] = useState(false);

  // Apply category from URL when it changes
  useEffect(() => {
    if (categoryFromUrl && !initialCategoryApplied) {
      setSelectedCategories([categoryFromUrl]);
      setPendingCategories([categoryFromUrl]);
      setInitialCategoryApplied(true);
    }
  }, [categoryFromUrl, initialCategoryApplied]);

  // Fetch categories for filter labels
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await getCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when search, filters, or page changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: GetProductsParams = {
          page: pagination.page,
          limit: pagination.limit,
          sort: filters.sort,
          order: filters.order,
        };

        if (search) {
          params.search = search;
        }

        if (selectedCategories.length > 0) {
          params.category = selectedCategories.join(',');
        }

        const response: PaginatedResponse<Product> = await getProducts(params);
        setProducts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [search, selectedCategories, filters, pagination.page, pagination.limit]);

  const handleApplyFilters = () => {
    // Save search term to history for recommendations
    if (pendingSearch.trim()) {
      addSearchToHistory(
        pendingSearch,
        pendingCategories.length > 0 ? pendingCategories[0] : undefined
      );
    }

    setSearch(pendingSearch);
    setSelectedCategories(pendingCategories);
    setFilters(pendingFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on search
  };

  const handleSearchChange = (newSearch: string) => {
    // Save search term to history for recommendations
    if (newSearch.trim()) {
      addSearchToHistory(newSearch);
    }

    setSearch(newSearch);
    setPendingSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleCategory = (categorySlug: string) => {
    const newCategories = pendingCategories.includes(categorySlug)
      ? pendingCategories.filter(c => c !== categorySlug)
      : [...pendingCategories, categorySlug];

    setPendingCategories(newCategories);
    setSelectedCategories(newCategories);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    const defaultFilters: FilterOptions = { sort: 'createdAt', order: 'desc' };
    setSearch('');
    setSelectedCategories([]);
    setFilters(defaultFilters);
    setPendingSearch('');
    setPendingCategories([]);
    setPendingFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Build active filters array based on pending values
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = [];

    if (pendingSearch) {
      filters.push({
        type: 'search',
        label: pendingSearch,
        value: pendingSearch,
        onRemove: () => {
          setPendingSearch('');
          setSearch('');
        },
      });
    }

    if (pendingCategories.length > 0) {
      pendingCategories.forEach((categorySlug) => {
        const category = categories.find(
          (cat) => cat.slug === categorySlug || cat.id === categorySlug
        );
        filters.push({
          type: 'category',
          label: category?.name || categorySlug,
          value: categorySlug,
          onRemove: () => {
            const newCategories = pendingCategories.filter(c => c !== categorySlug);
            setPendingCategories(newCategories);
            setSelectedCategories(newCategories);
          },
        });
      });
    }

    return filters;
  }, [pendingSearch, pendingCategories, categories]);

  return (
    <div className="pt-20">
      {/* Hero section */}
      <section className="section bg-gradient-to-br from-primary to-secondary text-foreground overflow-hidden relative">
        {/* Subtle lime glow accent */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1 bg-accent text-accent-foreground border border-accent/60 backdrop-blur-sm rounded-full text-sm font-bold mb-6">
              Catálogo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Nuestros productos
            </h1>
            <p className="text-xl text-white/80">
              Explora nuestra colección de regalos corporativos diseñados para impresionar.
            </p>
            {!isLoading && pagination.total > 0 && (
              <span className="inline-block mt-6 px-4 py-1.5 bg-white/20 text-white backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                <span className="font-bold text-accent">{pagination.total}</span> productos disponibles
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Products section */}
      <section className="section">
        <div className="container">
          {/* Search and Filters - Horizontal Layout */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              {/* Search bar */}
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Search className="h-4 w-4" />
                  Búsqueda
                </label>
                <Input
                  type="text"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="Buscar productos por nombre o descripción..."
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-64">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FolderTree className="h-4 w-4" />
                  Categoría
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="w-full justify-between">
                      {pendingCategories.length > 0
                        ? `${pendingCategories.length} categoría${pendingCategories.length > 1 ? 's' : ''}`
                        : 'Seleccionar categorías'}
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
                            setSelectedCategories([]);
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
                        key={category.id}
                        checked={pendingCategories.includes(category.slug)}
                        onCheckedChange={() => toggleCategory(category.slug)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{getCategoryDisplayName(category.name)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({category.productCount})
                          </span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort Dropdown */}
              <div className="w-full lg:w-auto">
                <label className="block text-sm font-medium mb-2 lg:invisible">Ordenar</label>
                <TooltipProvider>
                  <Tooltip>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="lg" className="w-full lg:w-auto">
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ordenar productos</p>
                      </TooltipContent>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPendingFilters({ sort: 'createdAt', order: 'desc' })}
                          className={pendingFilters.sort === 'createdAt' && pendingFilters.order === 'desc' ? 'bg-accent/20 text-accent-foreground font-semibold' : ''}
                        >
                          Fecha de creación (Recientes primero)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPendingFilters({ sort: 'createdAt', order: 'asc' })}
                          className={pendingFilters.sort === 'createdAt' && pendingFilters.order === 'asc' ? 'bg-accent/20 text-accent-foreground font-semibold' : ''}
                        >
                          Fecha de creación (Antiguos primero)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPendingFilters({ sort: 'name', order: 'asc' })}
                          className={pendingFilters.sort === 'name' && pendingFilters.order === 'asc' ? 'bg-accent/20 text-accent-foreground font-semibold' : ''}
                        >
                          Nombre (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPendingFilters({ sort: 'name', order: 'desc' })}
                          className={pendingFilters.sort === 'name' && pendingFilters.order === 'desc' ? 'bg-accent/20 text-accent-foreground font-semibold' : ''}
                        >
                          Nombre (Z-A)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Search Button */}
              <div className="w-full lg:w-auto">
                <Button
                  onClick={handleApplyFilters}
                  size="lg"
                  className="w-full lg:w-auto px-8"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-6">
              <ActiveFilters
                filters={activeFilters}
                onClearAll={handleClearAllFilters}
              />
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {isLoading ? (
                'Cargando productos...'
              ) : (
                <>
                  Mostrando <span className="font-bold text-accent-foreground">{products.length}</span> de{' '}
                  <span className="font-bold text-accent-foreground">{pagination.total}</span> producto
                  {pagination.total !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Products grid */}
          {!isLoading && <ProductList products={products} />}

          {/* Empty state with search */}
          {!isLoading && products.length === 0 && search && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/15 mb-6">
                <PackageOpen className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sin resultados</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No se encontraron productos que coincidan con{' '}
                <span className="font-semibold text-primary">"{search}"</span>.
                Intenta con otros términos o explora nuestras categorías.
              </p>
              <Button variant="outline" onClick={() => handleSearchChange('')} className="border-accent/40 hover:bg-accent/10">
                Limpiar búsqueda
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && products.length > 0 && (
            <div className="mt-12">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>

      {/* CTA section */}
      <section className="section relative overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-accent/10">
        {/* Decorative accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-6">
            <MessageSquareQuote className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg">
            Podemos crear productos personalizados según tus necesidades específicas.
            Contáctanos para una cotización a medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/contacto">Solicitar cotización personalizada</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 border-accent bg-accent/10 hover:bg-accent/20 text-accent-foreground">
              <Link href="/kits-corporativos">Ver kits corporativos</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProductosContent />
    </Suspense>
  );
}
