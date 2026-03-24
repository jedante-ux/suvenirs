'use client';

import React from 'react';
import { Users, Package, Star } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

const StatCard = React.memo(function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  index,
  isInView,
}: {
  icon: typeof Users;
  value: number;
  suffix: string;
  label: string;
  index: number;
  isInView: boolean;
}) {
  const count = useCountUp(value, isInView);
  const isDone = count === value;

  return (
    <div
      className="text-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
        transitionDelay: `${index * 0.12}s`,
      }}
    >
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 border border-white/10 hover:border-[#D3DC2A]/40">
        <div className="flex justify-center mb-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-[#D3DC2A]/15 flex items-center justify-center transition-all duration-500 ${isDone && isInView ? 'animate-glow-pulse' : ''}`}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-[#D3DC2A]" />
          </div>
        </div>
        <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums">
          {Number.isInteger(value) ? count.toLocaleString() : count}<span className="text-[#D3DC2A]">{suffix}</span>
        </p>
        <p className="text-white/80 text-sm md:text-base group-hover:text-white transition-colors duration-300">
          {label}
        </p>
      </div>
    </div>
  );
});

const stats = [
  { icon: Users, value: 500, suffix: '+', label: 'Clientes' },
  { icon: Package, value: 10000, suffix: '+', label: 'Entregas' },
  { icon: Star, value: 4.9, suffix: '★', label: 'Satisfacción' },
];

export default function Stats() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <section className="py-12 md:py-16 bg-[#1F1F1F] relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#D3DC2A] to-secondary" />
      <div className="container">
        <div ref={ref} className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
