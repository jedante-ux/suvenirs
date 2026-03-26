'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Truck, Gift } from 'lucide-react';

// ── Config ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;
const GRID_SIZE = 9;

// ── Detect reduced motion once ──
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Rotating word — simplified: 2 state updates instead of 6 ──
function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setAnimating(false);
      }, 400);
    }, WORD_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (reduced.current) {
    return (
      <span className="text-[#F5D966] font-extrabold">
        {ROTATING_WORDS[index]}
      </span>
    );
  }

  return (
    <span
      className="inline-flex relative overflow-hidden align-bottom"
      role="status"
      aria-live="polite"
      aria-label={`Categoría: ${ROTATING_WORDS[index]}`}
    >
      <span
        className="inline-block text-[#F5D966] font-extrabold whitespace-nowrap"
        style={{
          transform: animating ? 'translateY(-110%)' : 'translateY(0)',
          opacity: animating ? 0 : 1,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </span>
  );
}

// ── Static grid — load once, no swapping ──

// ── Entrance transition helper (respects reduced motion) ──
function useEntrance() {
  const [mounted, setMounted] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const style = useCallback(
    (delay: number): React.CSSProperties => {
      if (reduced.current) return { opacity: 1 };
      return {
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
      };
    },
    [mounted]
  );

  return { mounted, style, reduced: reduced.current };
}

export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const { mounted, style: entranceStyle, reduced } = useEntrance();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ limit: GRID_SIZE, random: true });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="relative pt-[6.5rem] md:pt-[7.5rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FE248A 0%, #FF6B9D 50%, #FE248A 100%)' }}>

      <div className="container relative z-10 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 lg:py-0 lg:h-[calc(100vh-5rem)]">
          {/* Left column — glass card */}
          <div className="text-center lg:text-left relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-10">
            {/* Badges */}
            <div
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              style={entranceStyle(0.1)}
            >
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 font-medium animate-fadeIn"
              >
                <Truck size={14} className="mr-2" />
                Envío a todo Chile
              </Badge>
              <Badge className="px-4 py-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 font-bold animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                <Gift size={14} className="mr-2" />
                Descuentos al mayor
              </Badge>
            </div>

            {/* H1 */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={entranceStyle(0.2)}
            >
              Regalos<br />
              <RotatingWord /><br />
              que Inspiran
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0"
              style={entranceStyle(0.3)}
            >
              Encuentra el regalo perfecto para cada ocasión. Cajas gourmet, merchandising personalizado y mucho más para sorprender a tus clientes y colaboradores.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full"
              style={entranceStyle(0.4)}
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-[#FE248A] hover:bg-white/90 rounded-full px-8 group hero-cta-shimmer relative overflow-hidden font-bold transition-transform duration-300 hover:scale-[1.03]"
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
                className="w-full sm:w-auto border-2 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full px-8 transition-all duration-300 font-semibold hover:scale-[1.03]"
              >
                <Link href="/contacto">
                  Cotizar ahora
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column — Product grid */}
          <div
            className="relative block"
            style={{
              ...(reduced
                ? { opacity: 1 }
                : {
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
                    transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: '0.25s',
                  }),
            }}
          >
            <div className="grid grid-cols-3 grid-rows-3 gap-2.5 lg:gap-3 w-full max-w-xs sm:max-w-sm lg:max-w-lg mx-auto">
              {products.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug || product.productId}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-[1.04] transition-transform duration-300"
                >
                  <SafeImage
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 170px"
                    className="object-cover"
                    priority={index < 3}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <p className="text-white text-sm font-semibold text-center px-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {product.name}
                    </p>
                  </div>
                </Link>
              ))}
              {products.length === 0 &&
                Array.from({ length: GRID_SIZE }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square rounded-2xl bg-white/20 animate-pulse"
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
