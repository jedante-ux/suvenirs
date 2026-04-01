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
      <div className="p-6 rounded-2xl bg-white border border-border/60 transition-all duration-300 hover:border-primary/30">
        <div className="flex justify-center mb-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-500 ${isDone && isInView ? 'animate-glow-pulse' : ''}`}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 tabular-nums">
          {Number.isInteger(value) ? count.toLocaleString() : count}<span className="text-primary">{suffix}</span>
        </p>
        <p className="text-muted-foreground text-sm md:text-base group-hover:text-foreground transition-colors duration-300">
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
    <section className="py-12 md:py-16 relative bg-muted">
      <div className="container">
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
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
