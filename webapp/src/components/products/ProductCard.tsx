'use client';

import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/SafeImage';
import AddToCartButton from '@/components/cart/AddToCartButton';
import Link from 'next/link';
import { Star, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  return (
    <Link href={`/productos/${product.slug || product.productId}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full cursor-pointer p-0 gap-0">
        <div className="relative aspect-square bg-muted/50 overflow-hidden rounded-t-xl">
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            <SafeImage
              src={product.image || '/placeholder-product.jpg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
            />
          </div>
          {product.featured && (
            <Badge className="absolute top-6 left-6 bg-primary">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Destacado
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-[10px] text-muted-foreground/60 font-mono tracking-wide uppercase">{product.productId}</p>
          <h3 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>

        </CardContent>

        <CardFooter className="p-4 pt-0">
          <AddToCartButton product={product} className="w-full" />
        </CardFooter>
      </Card>
    </Link>
  );
}
