'use client';

import { Product } from '@/types';
import ProductCard from './ProductCard';
import { useInView } from '@/hooks/useInView';

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
            transitionDelay: isInView ? `${Math.min(index * 0.05, 0.4)}s` : '0s',
          }}
        >
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </div>
  );
}
