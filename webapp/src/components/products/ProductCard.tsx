'use client';

import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Eye, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addItem } = useCart();

  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
    toast.success('Producto agregado al carrito', {
      description: product.name,
    });
  };

  return (
    <Link href={`/productos/${product.slug || product.productId}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full cursor-pointer p-0 gap-0">
        <div className="relative aspect-square bg-muted/50 overflow-hidden rounded-t-xl">
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            <Image
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

        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1 min-w-0 basis-0 border-primary/40 text-primary hover:bg-primary/5 bg-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </Button>
          <Button
            className={`flex-1 min-w-0 basis-0 cursor-pointer hover:scale-[1.03] transition-all duration-200 ${justAdded ? 'bg-green-600 hover:bg-green-600' : ''}`}
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Agregado
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
