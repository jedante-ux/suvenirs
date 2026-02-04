'use client';

import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addItem, openCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openCart();
  };

  return (
    <Link href={`/productos/${product.slug}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg h-full cursor-pointer p-0 gap-0">
        <div className="relative aspect-square bg-[#f5f5f5] p-4 rounded-t-xl">
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
          {product.quantity === 0 && (
            <Badge className="absolute top-6 right-6 bg-red-500">
              Sin Stock
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-mono">{product.productId}</p>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {/* Prices */}
          {(product.price || product.salePrice) && (
            <div className="flex items-baseline gap-2 mt-3">
              {product.salePrice && product.price ? (
                <>
                  <span className="text-2xl font-bold text-primary">
                    ${product.salePrice.toLocaleString('es-CL')}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.price.toLocaleString('es-CL')}
                  </span>
                  <Badge variant="destructive" className="ml-auto">
                    {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                  </Badge>
                </>
              ) : product.price ? (
                <span className="text-2xl font-bold">
                  ${product.price.toLocaleString('es-CL')}
                </span>
              ) : product.salePrice ? (
                <span className="text-2xl font-bold text-primary">
                  ${product.salePrice.toLocaleString('es-CL')}
                </span>
              ) : null}
            </div>
          )}

        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1 min-w-0 basis-0 border-pink-500 text-pink-500 hover:bg-pink-50 bg-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </Button>
          <Button
            className="flex-1 min-w-0 basis-0"
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
