'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Truck, Gift, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/productos?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pt-4 pb-2">
      <div className="max-w-xl mx-auto lg:mx-0 bg-white/15 backdrop-blur-xl border border-white/25 rounded-full flex items-center px-2 py-1.5 transition-all focus-within:bg-white/25 focus-within:border-white/40">
        <Search className="h-4 w-4 text-white/60 ml-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar productos, categorías..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 text-sm px-3 py-1.5 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-white text-[#FE248A] rounded-full px-5 py-1.5 text-sm font-semibold hover:bg-white/90 transition-colors flex-shrink-0"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

// ── Config ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;
const GRID_SIZE = 6;
const SLIDER_SIZE = 4;

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
        const response = await getProducts({ limit: GRID_SIZE + SLIDER_SIZE, random: true });
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
        {/* Search bar */}
        <HeroSearch />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 lg:py-0 lg:h-[calc(100vh-7rem)]">
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

          {/* Right column — Slider + Product grid */}
          <div
            className="relative block space-y-3"
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
            {/* Featured product slider */}
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-lg mx-auto">
              <div className="relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                {products.length > GRID_SIZE && (() => {
                  const sliderProducts = products.slice(GRID_SIZE, GRID_SIZE + SLIDER_SIZE);
                  const [activeSlide, setActiveSlide] = React.useState(0);
                  React.useEffect(() => {
                    const timer = setInterval(() => setActiveSlide(p => (p + 1) % sliderProducts.length), 4000);
                    return () => clearInterval(timer);
                  }, [sliderProducts.length]);
                  const current = sliderProducts[activeSlide];
                  if (!current) return null;
                  return (
                    <Link href={`/productos/${current.slug || current.productId}`} className="flex items-center gap-4 p-3 group">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                        <SafeImage src={current.image || '/placeholder-product.jpg'} alt={current.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/50 font-mono uppercase">{current.productId}</p>
                        <p className="text-sm font-semibold text-white truncate group-hover:text-white/80">{current.name}</p>
                        <p className="text-xs text-white/60 mt-0.5">Personalizable</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {sliderProducts.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeSlide ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                      </div>
                    </Link>
                  );
                })()}
                {products.length <= GRID_SIZE && (
                  <div className="h-16 bg-white/10 animate-pulse rounded-2xl" />
                )}
              </div>
            </div>

            {/* Product grid 3x2 */}
            <div className="grid grid-cols-3 grid-rows-2 gap-2.5 lg:gap-3 w-full max-w-xs sm:max-w-sm lg:max-w-lg mx-auto">
              {products.slice(0, GRID_SIZE).map((product, index) => (
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
