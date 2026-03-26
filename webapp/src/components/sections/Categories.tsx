'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SwiperRef } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Category, Product } from '@/types';
import { getCategories, getProducts } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Gift, Trophy, Pen, Coffee, ShoppingBag, Package, Star, Gem,
  Medal, KeyRound, Stamp, Wine, Laptop, BookOpen, Briefcase, Box,
} from 'lucide-react';
import 'swiper/css';

// Map category keywords to icons
function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('trofeo') || n.includes('copa') || n.includes('torre')) return Trophy;
  if (n.includes('medalla')) return Medal;
  if (n.includes('llavero')) return KeyRound;
  if (n.includes('bolígrafo') || n.includes('lápic') || n.includes('libreta') || n.includes('cuaderno')) return Pen;
  if (n.includes('botella') || n.includes('mug') || n.includes('taz') || n.includes('termo') || n.includes('vaso')) return Coffee;
  if (n.includes('bolsa') || n.includes('mochila') || n.includes('bolso')) return ShoppingBag;
  if (n.includes('vino') || n.includes('descorchador')) return Wine;
  if (n.includes('tecnológ') || n.includes('usb')) return Laptop;
  if (n.includes('timbre') || n.includes('sello')) return Stamp;
  if (n.includes('galvano') || n.includes('cristal')) return Gem;
  if (n.includes('set de regalo') || n.includes('kit')) return Gift;
  if (n.includes('placa')) return Star;
  if (n.includes('caja') || n.includes('estuche') || n.includes('packaging')) return Box;
  if (n.includes('lanyard') || n.includes('identificación')) return Briefcase;
  if (n.includes('bamboo') || n.includes('línea bamboo')) return BookOpen;
  return Package;
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

// Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<SwiperRef>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await getCategories();
        const withProducts = cats.filter(c => c.productCount > 0);
        const shuffled = shuffleArray(withProducts).slice(0, 12);

        // Fetch 3 products per category in parallel
        const enriched = await Promise.all(
          shuffled.map(async (cat) => {
            try {
              const res = await getProducts({ category: cat.slug, limit: 3 });
              return { ...cat, products: res.data };
            } catch {
              return { ...cat, products: [] };
            }
          })
        );

        setCategories(enriched.filter(c => c.products.length > 0));
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="section" style={{ background: 'linear-gradient(135deg, #F47920 0%, #FF9A4D 50%, #F47920 100%)' }}>
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white/15 text-white border-white/25">
              Nuestras Categorías
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Lo que buscas para tus empleados está aquí
            </h2>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-none w-80 h-72 bg-white/20 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="section overflow-hidden" style={{ background: 'linear-gradient(135deg, #F47920 0%, #FF9A4D 50%, #F47920 100%)' }}>
      <div className="container overflow-hidden">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-white/15 text-white border-white/25 backdrop-blur-sm">
            Nuestras Categorías
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lo que buscas para tus empleados está aquí
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Encuentra el regalo corporativo perfecto para reconocer, motivar y sorprender a tu equipo
            en cada momento importante.
          </p>
        </div>

        {/* Categories slider */}
        <Swiper
          ref={swiperRef}
          modules={[Autoplay]}
          grabCursor
          centeredSlides
          slidesPerView="auto"
          spaceBetween={20}
          loop={categories.length > 3}
          autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          className="!overflow-hidden"
        >
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            return (
              <SwiperSlide key={category.id} className="!w-[320px]">
                <Link
                  href={`/productos?category=${category.slug}`}
                  className="group block rounded-2xl bg-white border border-border/60 overflow-hidden hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* Top: 3 product images grid */}
                  <div className="grid grid-cols-3 gap-0.5 h-36 bg-muted">
                    {category.products.slice(0, 3).map((product, i) => (
                      <div key={product.id} className="relative overflow-hidden">
                        <SafeImage
                          src={product.image || '/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          sizes="110px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                    {/* Fill empty slots if less than 3 products */}
                    {Array.from({ length: Math.max(0, 3 - category.products.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-muted" />
                    ))}
                  </div>

                  {/* Bottom: icon + name + count */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category.productCount} productos
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => swiperRef.current?.swiper.slidePrev()}
            className="w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white/70 transition-all duration-300"
            aria-label="Anterior"
          />
          <button
            className="w-3.5 h-3.5 rounded-full bg-white transition-all duration-300"
            aria-label="Actual"
          />
          <button
            onClick={() => swiperRef.current?.swiper.slideNext()}
            className="w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white/70 transition-all duration-300"
            aria-label="Siguiente"
          />
        </div>
      </div>
    </section>
  );
}
