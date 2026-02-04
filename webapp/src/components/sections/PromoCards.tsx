'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

const promos = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=500&fit=crop',
    discount: '50',
    prefix: '',
    title: 'cajas de regalo',
    subtitle: '*marcas seleccionadas',
    extraDiscount: '+10% descuento adicional',
    brands: ['PREMIUM', 'GOURMET', 'DELUXE'],
    href: '/productos/cajas',
    accentColor: 'text-pink-500',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=500&fit=crop',
    discount: '50',
    prefix: 'hasta',
    title: 'kits corporativos',
    subtitle: null,
    extraDiscount: null,
    brands: ['WELCOME', 'EXECUTIVE', 'PREMIUM'],
    href: '/productos/kits',
    accentColor: 'text-pink-500',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=500&fit=crop',
    discount: '70',
    prefix: 'hasta',
    title: 'grabados personalizados',
    subtitle: null,
    extraDiscount: null,
    brands: ['LÁSER', 'METAL', 'CRISTAL'],
    href: '/productos/grabados',
    accentColor: 'text-pink-500',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop',
    discount: '50',
    prefix: 'hasta',
    title: 'productos gourmet',
    subtitle: null,
    extraDiscount: null,
    brands: ['GOURMET', 'PREMIUM', 'SELECT'],
    href: '/productos/gourmet',
    accentColor: 'text-pink-500',
  },
];

export default function PromoCards() {
  return (
    <section className="section bg-muted/30">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ofertas especiales
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aprovecha nuestras promociones exclusivas en regalos corporativos
          </p>
        </div>

        {/* Promo cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {promos.map((promo) => (
            <Link key={promo.id} href={promo.href} className="group">
              <Card className="overflow-hidden bg-gradient-to-b from-muted/50 to-background border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                {/* Image container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-t-xl mx-3 mt-3">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-4 pt-6 text-center">
                  {/* Discount */}
                  <div className="mb-2">
                    {promo.prefix && (
                      <span className="text-sm text-muted-foreground block">{promo.prefix}</span>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-5xl md:text-6xl font-bold ${promo.accentColor}`}>
                        {promo.discount}
                      </span>
                      <div className="flex flex-col items-start">
                        <span className={`text-2xl font-bold ${promo.accentColor}`}>%</span>
                        <span className={`text-sm font-medium ${promo.accentColor}`}>dcto.</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {promo.title}
                  </h3>

                  {/* Subtitle */}
                  {promo.subtitle && (
                    <p className="text-xs text-muted-foreground mb-2">{promo.subtitle}</p>
                  )}

                  {/* Extra discount badge */}
                  {promo.extraDiscount && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-foreground text-background text-xs font-medium rounded mb-3">
                      {promo.extraDiscount}
                    </div>
                  )}

                  {/* Brands */}
                  <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border">
                    {promo.brands.map((brand, index) => (
                      <span
                        key={index}
                        className="text-xs font-semibold text-muted-foreground tracking-wide"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
