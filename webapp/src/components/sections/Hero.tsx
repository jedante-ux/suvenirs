'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Config ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;
const GRID_SIZE = 6;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Search bar (centered) ──
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
      <div className="w-full max-w-xl bg-white/20 border border-white/30 rounded-full flex items-center px-2 py-1.5 transition-all focus-within:bg-white/30 focus-within:border-white/50">
        <input
          type="text"
          placeholder="Buscar productos, categorías..."
          aria-label="Buscar productos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 text-sm px-4 py-1.5 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="bg-white text-primary rounded-full p-2.5 hover:bg-white/90 transition-colors flex-shrink-0"
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

// ── Banner ──
const BANNER_IMAGES = [
  { src: '/banner2.jpg', alt: 'Suvenirs — Regalos Corporativos Personalizados', href: '/productos' },
];

function HeroBanner() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (BANNER_IMAGES.length <= 1) return;
    const timer = setInterval(() => setActive(p => (p + 1) % BANNER_IMAGES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Link href={BANNER_IMAGES[active].href} className="block relative w-full aspect-[4/1]">
      <SafeImage
        src={BANNER_IMAGES[active].src}
        alt={BANNER_IMAGES[active].alt}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {BANNER_IMAGES.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" role="tablist" aria-label="Banners">
          {BANNER_IMAGES.map((banner, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Banner ${i + 1}: ${banner.alt}`}
              onClick={(e) => { e.preventDefault(); setActive(i); }}
              className="w-11 h-11 flex items-center justify-center"
            >
              <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/40'}`} />
            </button>
          ))}
        </div>
      )}
    </Link>
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

// ── Main Hero ──
export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const { mounted, style: entranceStyle, reduced } = useEntrance();

  useEffect(() => {
    getProducts({ limit: GRID_SIZE, random: true })
      .then(r => setProducts(r.data))
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-[6.5rem] md:pt-[7.5rem] bg-primary overflow-hidden">

      {/* Search bar — centered */}
      <div className="container relative z-10 pt-[10px] pb-[20px]">
        <HeroSearch />
      </div>

      {/* Banner — contained with rounded corners */}
      <div className="container">
        <div className="rounded-2xl overflow-hidden">
          <HeroBanner />
        </div>
      </div>

      {/* Content: H1 + CTAs left, Product grid right */}
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-28 lg:pb-36">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* Left: copy + CTAs */}
          <div className="text-center lg:text-left space-y-6" style={entranceStyle(0.1)}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mt-10">
              Regalos<br />
              <RotatingWord /><br />
              que Inspiran
            </h1>

            <p className="text-sm md:text-base text-white/85 max-w-lg mx-auto lg:mx-0">
              Merchandising personalizado, trofeos, copas y reconocimientos. Cotiza online y recibe en todo Chile.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 rounded-full px-8 group hero-cta-shimmer relative overflow-hidden font-bold transition-transform duration-300 hover:scale-[1.03]"
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
                className="w-full sm:w-auto border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 rounded-full px-8 transition-all duration-300 font-semibold hover:scale-[1.03]"
              >
                <Link href="/contacto">Cotizar ahora</Link>
              </Button>
            </div>
          </div>

          {/* Right: product grid 3x2 */}
          <div
            style={{
              ...(reduced
                ? { opacity: 1 }
                : {
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'scale(1)' : 'scale(0.92)',
                    transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: '0.25s',
                  }),
            }}
          >
            <div className="grid grid-cols-3 grid-rows-2 gap-2.5 lg:gap-3 w-full max-w-md lg:max-w-lg mx-auto">
              {products.slice(0, GRID_SIZE).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug || product.productId}`}
                  className="group relative aspect-square rounded-xl overflow-hidden hover:scale-[1.04] transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  <SafeImage
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 170px"
                    className="object-cover"
                    priority={index < 3}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <p className="text-white text-xs font-semibold text-center px-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {product.name}
                    </p>
                  </div>
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
