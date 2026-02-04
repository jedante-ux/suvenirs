'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Category } from '@/types';
import { getCategories } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // Filter categories with products and images
        const categoriesWithProducts = data.filter(
          (cat) => cat.productCount > 0 && cat.image
        );
        // Shuffle categories to randomize order
        const shuffledCategories = shuffleArray(categoriesWithProducts);
        setCategories(shuffledCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
              Nuestras Categorías
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lo que buscas para tus empleados está aquí
            </h2>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-none w-80 h-64 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="section bg-gray-50">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
            Nuestras Categorías
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Lo que buscas para tus empleados está aquí
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encuentra el regalo corporativo perfecto para reconocer, motivar y sorprender a tu equipo
            en cada momento importante.
          </p>
        </div>

        {/* Categories slider */}
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          navigation
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
          }}
          className="categories-swiper"
        >
          {categories.map((category) => (
            <SwiperSlide key={category._id}>
              <Link
                href={`/productos?category=${category.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 block h-64"
              >
                {/* Background image */}
                <div className="relative h-full overflow-hidden">
                  <Image
                    src={category.image || '/placeholder-product.jpg'}
                    alt={category.name}
                    fill
                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2 transition-transform">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {category.productCount} productos disponibles
                  </p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
