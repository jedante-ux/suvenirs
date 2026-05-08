'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Config ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;
const GRID_SIZE = 4;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Search bar ──
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
    <form onSubmit={handleSubmit} role="search" className="w-full flex justify-center">
      <div className="w-full max-w-xl bg-white border border-white/40 rounded-full flex items-center px-1.5 py-1 transition-all shadow-sm">
        <input
          type="text"
          placeholder="Busca lo que necesites para tu empresa..."
          aria-label="Buscar productos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent border-none text-foreground placeholder:text-foreground/50 text-sm px-4 py-1.5 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="bg-primary text-white rounded-full p-2.5 hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ── Rotating word ──
function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const reduced = useRef(false);

  useEffect(() => { reduced.current = prefersReducedMotion(); }, []);

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
    return <span className="text-accent font-extrabold">{ROTATING_WORDS[index]}</span>;
  }

  return (
    <span className="inline-flex relative overflow-hidden align-bottom" role="status" aria-live="polite" aria-label={`Categoría: ${ROTATING_WORDS[index]}`}>
      <span
        className="inline-block text-accent font-extrabold whitespace-nowrap"
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

// ── Entrance animation ──
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
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
      };
    },
    [mounted]
  );

  return { mounted, style, reduced: reduced.current };
}

// ── Banner data ──
const FALLBACK_BANNER = { imageUrl: '/banner2.jpg', alt: 'Suvenirs', linkUrl: null };

// ── Main Hero ──
export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<{ imageUrl: string; alt: string; linkUrl: string | null }[]>([]);
  const [active, setActive] = useState(0);
  const { style: entranceStyle } = useEntrance();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    getProducts({ limit: GRID_SIZE, random: true })
      .then(r => setProducts(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/site/banners')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) setBanners(d.data);
        else setBanners([FALLBACK_BANNER]);
      })
      .catch(() => setBanners([FALLBACK_BANNER]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActive(p => (p + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = (index: number) => {
    if (banners.length === 0) return;
    setActive((index + banners.length) % banners.length);
  };

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? active + 1 : active - 1);
    }
  };

  const currentBanner = banners[active] || FALLBACK_BANNER;

  return (
    <section className="relative pt-[5.5rem] md:pt-[6.5rem] bg-primary overflow-hidden">
      {/* Search bar */}
      <div className="container relative z-20 pt-3 pb-5">
        <HeroSearch />
      </div>

      {/* Banner background slider */}
      <div className="relative w-full">
        <div
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ height: 'clamp(420px, 65vh, 620px)' }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; handleSwipe(); }}
          onMouseDown={(e) => { touchStartX.current = e.clientX; }}
          onMouseUp={(e) => { touchEndX.current = e.clientX; handleSwipe(); }}
        >
          {/* Banner images sliding */}
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {banners.map((banner, i) => (
              <div key={i} className="relative h-full flex-shrink-0" style={{ minWidth: '100%' }}>
                <SafeImage
                  src={banner.imageUrl}
                  alt={banner.alt}
                  fill
                  sizes="100vw"
                  className="object-cover pointer-events-none"
                  priority={i === 0}
                />
              </div>
            ))}
            {banners.length === 0 && (
              <div className="relative h-full flex-shrink-0 bg-primary/30" style={{ minWidth: '100%' }} />
            )}
          </div>

          {/* Subtle dark overlay for card legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 pointer-events-none" />

          {/* Side arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => goTo(active - 1)}
                aria-label="Banner anterior"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={() => goTo(active + 1)}
                aria-label="Banner siguiente"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/50 transition-colors"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* ── Floating cards over banner ── */}
          {/* Mobile: stacked column at bottom, full width */}
          <div className="md:hidden absolute inset-x-0 bottom-3 px-3 pointer-events-none">
            <div className="flex flex-col gap-2 max-w-md mx-auto">
              <div
                className="pointer-events-auto rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-3 shadow-xl"
                style={entranceStyle(0.1)}
              >
                <h1 className="text-xl font-bold text-white leading-[1.15]">
                  Regalos <RotatingWord /> que Inspiran
                </h1>
              </div>
              <div
                className="pointer-events-auto rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-3 shadow-xl"
                style={entranceStyle(0.2)}
              >
                <p className="text-xs text-white leading-snug mb-2">
                  Merch personalizado para cada ocasión. Cotiza online y recibe en todo Chile.
                </p>
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-white text-primary hover:bg-white/90 rounded-full font-bold h-8 text-xs"
                  >
                    <Link href="/contacto">Cotizar</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/50 text-white bg-white/10 hover:bg-white/25 rounded-full font-semibold h-8 text-xs"
                  >
                    <Link href="/productos">Ver colección</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: floating cards positioned absolutely */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            <div className="container h-full relative">
              {/* Left card: title */}
              <div
                className="pointer-events-auto absolute left-20 lg:left-24 bottom-6 lg:bottom-10 max-w-[260px] lg:max-w-[300px]"
                style={entranceStyle(0.1)}
              >
                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-4 sm:p-5 shadow-xl">
                  <h1 className="text-3xl lg:text-[2.25rem] font-bold text-white leading-[1.1]">
                    Regalos<br />
                    <RotatingWord /><br />
                    que Inspiran
                  </h1>
                </div>
              </div>

              {/* Right card: description + CTAs */}
              <div
                className="pointer-events-auto absolute right-20 lg:right-24 bottom-6 lg:bottom-10 max-w-[260px] lg:max-w-[300px]"
                style={entranceStyle(0.2)}
              >
                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-4 sm:p-5 shadow-xl space-y-3">
                  <p className="text-sm text-white leading-snug">
                    Merch personalizado para cada ocasión. Cotiza online y recibe en todo Chile.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-white text-primary hover:bg-white/90 rounded-full font-bold"
                    >
                      <Link href="/contacto">Cotizar ahora</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full border-white/50 text-white bg-white/10 hover:bg-white/25 rounded-full font-semibold"
                    >
                      <Link href="/productos">
                        Ver colección
                        <ArrowRightIcon size={14} className="ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center card: product strip (md+ only) */}
              <div
                className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-6 lg:bottom-10"
                style={entranceStyle(0.15)}
              >
                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-3 shadow-xl">
                  <div className="flex gap-2">
                    {products.slice(0, GRID_SIZE).map((product, index) => (
                      <Link
                        key={product.id}
                        href={`/productos/${product.slug || product.productId}`}
                        className="group relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-white/40 border border-white/40 hover:scale-[1.04] transition-transform"
                      >
                        <SafeImage
                          src={product.images?.[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          sizes="100px"
                          className="object-cover"
                          priority={index < 2}
                        />
                      </Link>
                    ))}
                    {products.length === 0 &&
                      Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <div key={`ph-${i}`} className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-white/30 animate-pulse" />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots removed — navigation via arrows and swipe only */}
      </div>
    </section>
  );
}
