'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRightIcon, CartIcon } from '../icons';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Package, ShoppingCart, Star, Sparkles } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { buildRecommendationQuery, hasSearchHistory, getRecentSearchTerms } from '@/lib/searchHistory';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if user has search history
        const hasHistory = hasSearchHistory();
        const recommendationQuery = buildRecommendationQuery();

        if (hasHistory && recommendationQuery) {
          // Fetch products based on search history
          const response = await getProducts({
            limit: 15,
            search: recommendationQuery,
          });

          // If we found products based on history, use them
          if (response.data.length >= 5) {
            setProducts(response.data);
            setIsPersonalized(true);
          } else {
            // If not enough results, supplement with random products
            const randomResponse = await getProducts({ limit: 15, random: true });

            // Combine: prioritize search results, then add random ones
            const combinedProducts = [...response.data];
            const existingIds = new Set(response.data.map(p => p._id));

            for (const product of randomResponse.data) {
              if (!existingIds.has(product._id) && combinedProducts.length < 15) {
                combinedProducts.push(product);
              }
            }

            setProducts(combinedProducts);
            setIsPersonalized(response.data.length > 0);
          }
        } else {
          // No search history, fetch random products
          const response = await getProducts({ limit: 15, random: true });
          setProducts(response.data);
          setIsPersonalized(false);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to random products on error
        try {
          const response = await getProducts({ limit: 15, random: true });
          setProducts(response.data);
        } catch {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    openCart();
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
                Nuestro catálogo
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Productos destacados
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Descubre los productos favoritos de nuestros clientes corporativos.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-3">
                  <div className="h-3 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <Badge variant="outline" className={`mb-4 ${isPersonalized ? 'text-pink-500 border-pink-500/20 bg-pink-500/5' : 'text-primary border-primary/20 bg-primary/5'}`}>
              {isPersonalized ? (
                <>
                  <Sparkles size={12} className="mr-1" />
                  Para ti
                </>
              ) : (
                'Nuestro catálogo'
              )}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isPersonalized ? 'Recomendados para ti' : 'Productos destacados'}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {isPersonalized
                ? 'Productos seleccionados basados en tus búsquedas anteriores.'
                : 'Descubre los productos favoritos de nuestros clientes corporativos.'}
            </p>
          </div>
          <Button asChild variant="ghost" className="text-primary mt-4 md:mt-0 group">
            <Link href="/productos">
              Ver todos los productos
              <ArrowRightIcon size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card
              key={product._id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.image || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Quick add button */}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-2 right-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all h-8 w-8"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.quantity === 0}
                >
                  <ShoppingCart size={14} />
                </Button>
              </div>

              {/* Content */}
              <CardContent className="p-3">
                {/* Title */}
                <h3 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
