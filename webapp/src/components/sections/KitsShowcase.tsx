'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '../icons';
import { Kit } from '@/types';
import { getKits } from '@/lib/api';
import { Boxes, Gift, ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export default function KitsShowcase() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInView<HTMLDivElement>();

  useEffect(() => {
    getKits()
      .then(data => setKits(data.filter(k => k.isActive && k.items.length > 0).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && kits.length === 0) return null;

  return (
    <section className="section" style={{ backgroundColor: '#E8B0BD' }}>
      <div className="container" ref={ref}>
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-[#2D2B3D]/10 text-[#2D2B3D] border-[#2D2B3D]/20 text-sm px-4 py-1.5 font-medium">
            <Boxes className="h-3.5 w-3.5 mr-1.5" />
            Kits Corporativos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D2B3D] mb-4">
            Packs listos para sorprender
          </h2>
          <p className="text-[#2D2B3D]/70 max-w-2xl mx-auto">
            Kits pre-armados con los mejores productos personalizables. Ideales para onboarding, eventos y regalos corporativos.
          </p>
        </div>

        {/* Kits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/10 h-72 animate-pulse" />
            ))
          ) : (
            kits.map((kit, index) => (
              <Link
                key={kit.id}
                href={`/kits`}
                className="group block rounded-2xl bg-white border border-border/60 overflow-hidden hover:scale-[1.02] transition-all duration-300"
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.3s ease',
                  transitionDelay: isInView ? `${index * 0.1}s` : '0s',
                }}
              >
                {/* Product images row */}
                <div className="flex h-32 gap-0.5 bg-muted">
                  {kit.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="relative flex-1 overflow-hidden">
                      <SafeImage
                        src={item.product.images?.[0] || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        sizes="140px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Kit info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {kit.name}
                    </h3>
                    <Gift className="h-5 w-5 text-primary/40 flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {kit.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/70">
                      {kit.items.length} productos · desde {Math.min(...kit.tiers)} unidades
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button asChild size="lg" className="bg-[#2D2B3D] text-white hover:bg-[#2D2B3D]/90 rounded-full px-8 font-bold transition-transform hover:scale-[1.03]">
            <Link href="/kits">
              Ver todos los kits
              <ArrowRightIcon size={18} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
