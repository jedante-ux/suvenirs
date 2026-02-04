'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Truck, Gift } from 'lucide-react';

export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ limit: 9, random: true });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="relative min-h-screen pt-16 md:pt-20 bg-white overflow-hidden">
      <div className="container relative z-10 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-black/10 backdrop-blur-sm text-black border-0"
              >
                <Truck size={14} className="mr-2" />
                Envío a todo Chile
              </Badge>
              <Badge className="px-4 py-2 bg-black text-white border-0">
                <Gift size={14} className="mr-2" />
                Descuentos al mayor
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4">
              Regalos{' '}
              <span className="bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">Corporativos</span>{' '}
              que Inspiran
            </h1>

            <p className="text-lg md:text-xl text-black mb-8 max-w-xl mx-auto lg:mx-0">
              Encuentra el regalo perfecto para cada ocasión. Cajas gourmet, merchandising personalizado y mucho más para sorprender a tus clientes y colaboradores.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                asChild
                size="lg"
                className="bg-pink-500 text-white hover:bg-pink-600 rounded-full px-8 group"
              >
                <Link href="/productos">
                  Ver colección
                  <ArrowRightIcon size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-pink-500 text-pink-500 bg-transparent hover:bg-pink-500 hover:text-white rounded-full px-8"
              >
                <Link href="/contacto">
                  Cotizar ahora
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column - Product grid */}
          <div className="relative hidden lg:block" style={{ perspective: '1500px' }}>
            <div
              className="grid grid-cols-3 grid-rows-3 gap-3 w-full max-w-lg mx-auto animate-float3D"
              style={{
                transformStyle: 'preserve-3d'
              }}
            >
              {products.slice(0, 9).map((product, index) => (
                <Link
                  key={product._id}
                  href={`/productos/${product.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  style={{
                    transform: 'translateZ(20px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Image
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-sm font-semibold text-center px-2">
                      {product.name}
                    </p>
                  </div>
                </Link>
              ))}
              {/* Placeholder boxes if less than 9 products */}
              {products.length < 9 && Array.from({ length: 9 - products.length }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="aspect-square rounded-2xl bg-gray-200 animate-pulse"
                  style={{
                    transform: 'translateZ(20px)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
