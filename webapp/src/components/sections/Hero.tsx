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

// ── Rotating words for the H1 ──
const ROTATING_WORDS = ['Corporativos', 'Personalizados', 'Únicos', 'Creativos'];
const WORD_INTERVAL = 3500;

// ── Grid tile swap config ──
const GRID_SIZE = 9;
const SWAP_INTERVAL = 3000;
const SWAP_DURATION = 400;

function RotatingWord() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setIsAnimating(false);
      }, 300);
    }, WORD_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative overflow-hidden align-bottom">
      <span
        className="inline-block bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent transition-all duration-300"
        style={{
          transform: isAnimating ? 'translateY(-110%)' : 'translateY(0)',
          opacity: isAnimating ? 0 : 1,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {ROTATING_WORDS[currentIndex]}
      </span>
    </span>
  );
}

interface GridTile {
  product: Product;
  isSwapping: boolean;
  isEntering: boolean;
}

function useAsyncGridSwap(allProducts: Product[]) {
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const swapQueueRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tiles when products load
  useEffect(() => {
    if (allProducts.length >= GRID_SIZE) {
      setTiles(
        allProducts.slice(0, GRID_SIZE).map((product) => ({
          product,
          isSwapping: false,
          isEntering: false,
        }))
      );
    }
  }, [allProducts]);

  const swapRandomTile = useCallback(() => {
    if (swapQueueRef.current || allProducts.length <= GRID_SIZE) return;
    swapQueueRef.current = true;

    const tileIndex = Math.floor(Math.random() * GRID_SIZE);

    // Phase 1: exit current tile
    setTiles((prev) =>
      prev.map((tile, i) =>
        i === tileIndex ? { ...tile, isSwapping: true } : tile
      )
    );

    // Phase 2: swap product and enter
    setTimeout(() => {
      setTiles((prev) => {
        const currentIds = new Set(prev.map((t) => t.product.id));
        const available = allProducts.filter((p) => !currentIds.has(p.id));
        if (available.length === 0) {
          swapQueueRef.current = false;
          return prev.map((tile, i) =>
            i === tileIndex ? { ...tile, isSwapping: false } : tile
          );
        }
        const newProduct = available[Math.floor(Math.random() * available.length)];
        return prev.map((tile, i) =>
          i === tileIndex
            ? { product: newProduct, isSwapping: false, isEntering: true }
            : tile
        );
      });

      // Phase 3: clear entering state
      setTimeout(() => {
        setTiles((prev) =>
          prev.map((tile, i) =>
            i === tileIndex ? { ...tile, isEntering: false } : tile
          )
        );
        swapQueueRef.current = false;
      }, SWAP_DURATION);
    }, SWAP_DURATION / 2);
  }, [allProducts]);

  // Start swap interval
  useEffect(() => {
    if (tiles.length === 0) return;

    // Initial delay before first swap
    const startDelay = setTimeout(() => {
      swapRandomTile();
      timerRef.current = setInterval(swapRandomTile, SWAP_INTERVAL);
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tiles.length, swapRandomTile]);

  return tiles;
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
        // Fetch more products for the swap pool
        const response = await getProducts({ limit: 25, random: true });
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
          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            <div
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.1s',
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

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.2s',
              }}
            >
              Regalos <RotatingWord /> que Inspiran
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.35s',
              }}
            >
              Encuentra el regalo perfecto para cada ocasión. Cajas gourmet, merchandising personalizado y mucho más para sorprender a tus clientes y colaboradores.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0.45s',
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

          {/* Right column - Product grid */}
          <div
            className="relative block"
            style={{
              perspective: '1500px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(20px)',
              transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '0.3s',
            }}
          >
            <div
              className="grid grid-cols-3 grid-rows-3 gap-2 lg:gap-3 w-full max-w-sm lg:max-w-lg mx-auto"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {tiles.map((tile, index) => (
                <Link
                  key={`tile-${index}`}
                  href={`/productos/${tile.product.slug || tile.product.productId}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
                  style={{
                    transform: tile.isSwapping
                      ? 'scale(0.85)'
                      : tile.isEntering
                        ? 'scale(1)'
                        : 'scale(1)',
                    opacity: tile.isSwapping ? 0 : 1,
                    transition: `transform ${SWAP_DURATION / 2}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${SWAP_DURATION / 2}ms cubic-bezier(0.16, 1, 0.3, 1)`,
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
              {/* Placeholder boxes while loading */}
              {tiles.length === 0 &&
                Array.from({ length: GRID_SIZE }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square rounded-2xl bg-muted animate-pulse"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${0.3 + index * 0.06}s`,
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
