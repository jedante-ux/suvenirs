'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '../icons';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { Truck, Gift } from 'lucide-react';

// ── Rotating words config ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;

// ── Grid tile swap config ──
const GRID_SIZE = 9;
const SWAP_INTERVAL = 2800;
const SWAP_ANIM_MS = 600;

// ── Rotating word with dual-layer crossfade ──
function RotatingWord() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % ROTATING_WORDS.length;
      setNextIndex(next);
      setPhase('exiting');

      // Midpoint: swap active word
      setTimeout(() => {
        setPhase('entering');
        setCurrentIndex(next);
      }, 350);

      // Done
      setTimeout(() => {
        setPhase('idle');
      }, 700);
    }, WORD_INTERVAL);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <span
      className="inline-flex relative overflow-hidden align-bottom"
      style={{ minWidth: '5ch' }}
    >
      {/* Current word — exits upward */}
      <span
        className="inline-block bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent whitespace-nowrap"
        style={{
          transform:
            phase === 'exiting' || phase === 'entering'
              ? 'translateY(-115%) scale(0.95)'
              : 'translateY(0) scale(1)',
          opacity: phase === 'exiting' || phase === 'entering' ? 0 : 1,
          filter: phase === 'exiting' ? 'blur(2px)' : 'blur(0px)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        }}
      >
        {ROTATING_WORDS[currentIndex]}
      </span>

      {/* Next word — enters from below */}
      <span
        className="absolute left-0 top-0 inline-block bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent whitespace-nowrap"
        style={{
          transform:
            phase === 'entering'
              ? 'translateY(0) scale(1)'
              : phase === 'exiting'
                ? 'translateY(110%) scale(0.95)'
                : 'translateY(110%) scale(0.95)',
          opacity: phase === 'entering' ? 1 : 0,
          filter: phase === 'exiting' ? 'blur(2px)' : 'blur(0px)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        }}
      >
        {ROTATING_WORDS[nextIndex]}
      </span>
    </span>
  );
}

// ── Preload image utility ──
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) { resolve(); return; }
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't block on error
    img.src = src;
  });
}

// ── Grid tile state ──
interface GridTile {
  product: Product;
  animState: 'idle' | 'flip-out' | 'flip-in';
}

function useAsyncGridSwap(allProducts: Product[]) {
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedIndicesRef = useRef<number[]>([]);

  // Initialize tiles
  useEffect(() => {
    if (allProducts.length >= GRID_SIZE) {
      setTiles(
        allProducts.slice(0, GRID_SIZE).map((product) => ({
          product,
          animState: 'idle' as const,
        }))
      );
      // Reset used indices tracking
      usedIndicesRef.current = [];
    }
  }, [allProducts]);

  const swapNextTile = useCallback(async () => {
    if (busyRef.current || allProducts.length <= GRID_SIZE) return;
    busyRef.current = true;

    // Pick a random tile that hasn't been swapped recently
    let tileIndex: number;
    if (usedIndicesRef.current.length >= GRID_SIZE) {
      usedIndicesRef.current = []; // Reset when all have been used
    }
    const available = Array.from({ length: GRID_SIZE }, (_, i) => i)
      .filter((i) => !usedIndicesRef.current.includes(i));
    tileIndex = available[Math.floor(Math.random() * available.length)];
    usedIndicesRef.current.push(tileIndex);

    // Pick a new product not currently shown
    const currentIds = new Set(tiles.map((t) => t.product.id));
    const pool = allProducts.filter((p) => !currentIds.has(p.id));
    if (pool.length === 0) { busyRef.current = false; return; }
    const newProduct = pool[Math.floor(Math.random() * pool.length)];

    // Preload the new image BEFORE starting animation
    await preloadImage(newProduct.image || '/placeholder-product.jpg');

    // Phase 1: flip out (card flips away)
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex ? { ...tile, animState: 'flip-out' } : tile
      )
    );

    // Phase 2: swap product + flip in
    await new Promise((r) => setTimeout(r, SWAP_ANIM_MS / 2));
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex
          ? { product: newProduct, animState: 'flip-in' }
          : tile
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

  // Start swap loop
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

// ── Tile animation styles ──
function getTileStyle(animState: GridTile['animState']) {
  const base = `transform ${SWAP_ANIM_MS / 2}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${SWAP_ANIM_MS / 2}ms cubic-bezier(0.16, 1, 0.3, 1)`;

  switch (animState) {
    case 'flip-out':
      return {
        transform: 'perspective(600px) rotateY(90deg) scale(0.9)',
        opacity: 0,
        transition: base,
      };
    case 'flip-in':
      return {
        transform: 'perspective(600px) rotateY(-30deg) scale(0.95)',
        opacity: 0.7,
        transition: base,
      };
    case 'idle':
    default:
      return {
        transform: 'perspective(600px) rotateY(0deg) scale(1)',
        opacity: 1,
        transition: base,
      };
  }
}

export default function Hero() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const tiles = useAsyncGridSwap(allProducts);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

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
    <section className="relative pt-16 md:pt-20 bg-white overflow-hidden">
      {/* Ambient pink gradient */}
      <div
        className="absolute top-0 right-0 w-[60%] h-[80%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(233, 30, 145, 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="container relative z-10 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 lg:py-0 lg:h-[calc(100vh-5rem)]">
          {/* Left column */}
          <div className="text-center lg:text-left">
            {/* Badges */}
            <div
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.15s',
              }}
            >
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-primary/10 backdrop-blur-sm text-primary border border-primary/20"
              >
                <Truck size={14} className="mr-2" />
                Envío a todo Chile
              </Badge>
              <Badge className="px-4 py-2 bg-primary text-primary-foreground border-0">
                <Gift size={14} className="mr-2" />
                Descuentos al mayor
              </Badge>
            </div>

            {/* H1 with rotating word */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(28px)',
                transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.25s',
              }}
            >
              Regalos <RotatingWord /> que Inspiran
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.4s',
              }}
            >
              Encuentra el regalo perfecto para cada ocasión. Cajas gourmet, merchandising personalizado y mucho más para sorprender a tus clientes y colaboradores.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.55s',
              }}
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 rounded-xl px-8 group hero-cta-shimmer relative overflow-hidden"
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
                className="w-full sm:w-auto border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground rounded-xl px-8 transition-all duration-300"
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
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
              transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '0.35s',
            }}
          >
            <div className="grid grid-cols-3 grid-rows-3 gap-2.5 lg:gap-3 w-full max-w-sm lg:max-w-lg mx-auto">
              {tiles.map((tile, index) => (
                <Link
                  key={`tile-${index}`}
                  href={`/productos/${tile.product.slug || tile.product.productId}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.04] transition-[box-shadow] duration-300"
                  style={{
                    ...getTileStyle(tile.animState),
                    transformOrigin: 'center center',
                  }}
                >
                  <Image
                    src={tile.product.image || '/placeholder-product.jpg'}
                    alt={tile.product.name}
                    fill
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
              {/* Placeholders while loading */}
              {tiles.length === 0 &&
                Array.from({ length: GRID_SIZE }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square rounded-2xl bg-muted animate-pulse"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${0.35 + index * 0.07}s`,
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
