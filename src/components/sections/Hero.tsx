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

      {/* Banner strip — edge to edge, top of hero */}
      <div
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: '5 / 1' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; handleSwipe(); }}
        onMouseDown={(e) => { touchStartX.current = e.clientX; }}
        onMouseUp={(e) => { touchEndX.current = e.clientX; handleSwipe(); }}
      >
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {banners.map((banner, i) => {
            const Wrapper = banner.linkUrl ? Link : 'div'
            const wrapperProps = banner.linkUrl ? { href: banner.linkUrl } : {}
            return (
              <Wrapper
                key={i}
                {...wrapperProps as any}
                className="relative h-full flex-shrink-0 block"
                style={{ minWidth: '100%' }}
              >
                <SafeImage
                  src={banner.imageUrl}
                  alt={banner.alt}
                  fill
                  sizes="100vw"
                  className="object-cover pointer-events-none"
                  priority={i === 0}
                />
              </Wrapper>
            )
          })}
          {banners.length === 0 && (
            <div className="relative h-full flex-shrink-0 bg-primary/30" style={{ minWidth: '100%' }} />
          )}
        </div>

        {/* Side arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => goTo(active - 1)}
              aria-label="Banner anterior"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => goTo(active + 1)}
              aria-label="Banner siguiente"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/50 transition-colors"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}
      </div>

      {/* Content below banner: title + CTAs + product grid */}
      <div className="container relative z-10 py-10 md:py-14">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: copy + CTAs */}
          <div className="text-center lg:text-left space-y-5" style={entranceStyle(0.1)}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1]">
              Regalos<br />
              <RotatingWord /><br />
              que Inspiran
            </h1>
            <p className="text-sm md:text-base text-white/85 max-w-lg mx-auto lg:mx-0">
              Merch personalizado para cada ocasión. Cotiza online y recibe en todo Chile.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold transition-transform duration-300 hover:scale-[1.03]"
              >
                <Link href="/contacto">Cotizar ahora</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 rounded-full px-8 font-semibold hover:scale-[1.03]"
              >
                <Link href="/productos">
                  Ver colección
                  <ArrowRightIcon size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: product grid */}
          <div style={entranceStyle(0.2)}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-3 w-full max-w-md lg:max-w-lg mx-auto">
              {products.slice(0, GRID_SIZE).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug || product.productId}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-white/20 border border-white/20 hover:scale-[1.04] transition-transform"
                >
                  <SafeImage
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="200px"
                    className="object-cover"
                    priority={index < 2}
                  />
                </Link>
              ))}
              {products.length === 0 &&
                Array.from({ length: GRID_SIZE }).map((_, i) => (
                  <div key={`ph-${i}`} className="aspect-square rounded-xl bg-white/20 animate-pulse" />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
