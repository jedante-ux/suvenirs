'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
const SWAP_INTERVAL = 2800;
const SWAP_ANIM_MS = 600;

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
      <span className="text-[#2D2B3D] font-extrabold underline decoration-[#2D2B3D]/30 decoration-4 underline-offset-4">
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
        className="inline-block text-[#2D2B3D] font-extrabold underline decoration-[#2D2B3D]/30 decoration-4 underline-offset-4 whitespace-nowrap"
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

// ── Preload image ──
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) { resolve(); return; }
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

// ── Grid tile swap hook ──
interface GridTile {
  product: Product;
  animState: 'idle' | 'flip-out' | 'flip-in';
}

function useAsyncGridSwap(allProducts: Product[]) {
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedIndicesRef = useRef<number[]>([]);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    if (allProducts.length >= GRID_SIZE) {
      setTiles(
        allProducts.slice(0, GRID_SIZE).map((product) => ({
          product,
          animState: 'idle' as const,
        }))
      );
      usedIndicesRef.current = [];
    }
  }, [allProducts]);

  const swapNextTile = useCallback(async () => {
    if (busyRef.current || allProducts.length <= GRID_SIZE) return;
    busyRef.current = true;

    // Pick random unused tile index
    if (usedIndicesRef.current.length >= GRID_SIZE) {
      usedIndicesRef.current = [];
    }
    const available = Array.from({ length: GRID_SIZE }, (_, i) => i)
      .filter((i) => !usedIndicesRef.current.includes(i));
    const tileIndex = available[Math.floor(Math.random() * available.length)];
    usedIndicesRef.current.push(tileIndex);

    // Pick new product
    let currentIds: Set<string>;
    setTiles((prev) => {
      currentIds = new Set(prev.map((t) => t.product.id));
      return prev;
    });
    // Read tiles synchronously for pool filtering
    const pool = allProducts.filter((p) => {
      // Use a fresh read
      return true; // Will be filtered below
    });

    // Get current tile IDs from ref-safe approach
    const currentTileIds = new Set(tiles.map((t) => t.product.id));
    const validPool = allProducts.filter((p) => !currentTileIds.has(p.id));
    if (validPool.length === 0) { busyRef.current = false; return; }
    const newProduct = validPool[Math.floor(Math.random() * validPool.length)];

    // Preload image before animating
    await preloadImage(newProduct.image || '/placeholder-product.jpg');

    if (reducedRef.current) {
      // No animation — just swap instantly
      setTiles((prev) =>
        prev.map((tile, i) =>
          i === tileIndex ? { product: newProduct, animState: 'idle' } : tile
        )
      );
      busyRef.current = false;
      return;
    }

    // Phase 1: flip out
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex ? { ...tile, animState: 'flip-out' } : tile
      )
    );

    // Phase 2: swap + flip in
    await new Promise((r) => setTimeout(r, SWAP_ANIM_MS / 2));
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex ? { product: newProduct, animState: 'flip-in' } : tile
      )
    );

    // Phase 3: settle
    await new Promise((r) => setTimeout(r, SWAP_ANIM_MS / 2));
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex ? { ...tile, animState: 'idle' } : tile
      )
    );
    busyRef.current = false;
  }, [allProducts, tiles]);

  useEffect(() => {
    if (tiles.length === 0) return;

    const startDelay = setTimeout(() => {
      swapNextTile();
      timerRef.current = setInterval(swapNextTile, SWAP_INTERVAL);
    }, 2500);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tiles.length, swapNextTile]);

  return tiles;
}

// ── Tile styles (memoizable) ──
const TILE_TRANSITION = `transform ${SWAP_ANIM_MS / 2}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${SWAP_ANIM_MS / 2}ms cubic-bezier(0.16, 1, 0.3, 1)`;

const TILE_STYLES: Record<GridTile['animState'], React.CSSProperties> = {
  'flip-out': {
    transform: 'perspective(600px) rotateY(90deg) scale(0.9)',
    opacity: 0,
    transition: TILE_TRANSITION,
  },
  'flip-in': {
    transform: 'perspective(600px) rotateY(-30deg) scale(0.95)',
    opacity: 0.7,
    transition: TILE_TRANSITION,
  },
  idle: {
    transform: 'perspective(600px) rotateY(0deg) scale(1)',
    opacity: 1,
    transition: TILE_TRANSITION,
  },
};

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { mounted, style: entranceStyle, reduced } = useEntrance();
  const tiles = useAsyncGridSwap(allProducts);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ limit: 30, random: true });
        setAllProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="relative pt-16 md:pt-20 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFB6D1 0%, #FFD4E4 30%, #FFF0F5 60%, #ffffff 100%)' }}>

      <div className="container relative z-10 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 lg:py-0 lg:h-[calc(100vh-5rem)]">
          {/* Left column */}
          <div className="text-center lg:text-left relative">
            {/* Readability overlay */}
            <div className="absolute -inset-6 rounded-3xl bg-white/30 backdrop-blur-[3px] -z-10 hidden lg:block" />
            {/* Badges */}
            <div
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              style={entranceStyle(0.1)}
            >
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-[#2D2B3D]/80 backdrop-blur-sm text-white border border-[#2D2B3D]/20"
              >
                <Truck size={14} className="mr-2" />
                Envío a todo Chile
              </Badge>
              <Badge className="px-4 py-2 bg-[#2D2B3D]/80 backdrop-blur-sm text-white border border-[#2D2B3D]/20 font-bold">
                <Gift size={14} className="mr-2" />
                Descuentos al mayor
              </Badge>
            </div>

            {/* H1 */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D2B3D] leading-tight mb-4"
              style={entranceStyle(0.2)}
            >
              Regalos<br />
              <RotatingWord /><br />
              que Inspiran
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl text-[#2D2B3D]/75 mb-8 max-w-xl mx-auto lg:mx-0"
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
                className="w-full sm:w-auto bg-[#2D2B3D] text-white hover:bg-[#2D2B3D]/90 rounded-full px-8 group hero-cta-shimmer relative overflow-hidden font-bold"
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
                className="w-full sm:w-auto border-2 border-[#2D2B3D]/40 text-[#2D2B3D] bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full px-8 transition-all duration-300 font-semibold"
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
              perspective: '1200px',
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
              {tiles.map((tile, index) => (
                <Link
                  key={`tile-${index}`}
                  href={`/productos/${tile.product.slug || tile.product.productId}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden hover:scale-[1.04] transition-transform duration-300"
                  style={{
                    ...TILE_STYLES[tile.animState],
                    transformOrigin: 'center center',
                  }}
                >
                  <Image
                    src={tile.product.image || '/placeholder-product.jpg'}
                    alt={tile.product.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 170px"
                    className="object-cover"
                    priority={index < 3}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <p className="text-white text-sm font-semibold text-center px-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {tile.product.name}
                    </p>
                  </div>
                </Link>
              ))}
              {/* Placeholders */}
              {tiles.length === 0 &&
                Array.from({ length: GRID_SIZE }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square rounded-2xl bg-muted animate-pulse"
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
