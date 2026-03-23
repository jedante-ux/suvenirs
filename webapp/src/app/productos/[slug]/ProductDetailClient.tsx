'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { ShoppingCart, Check } from 'lucide-react';
import { addSearchToHistory } from '@/lib/searchHistory';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Save to search history on mount
  if (typeof window !== 'undefined') {
    addSearchToHistory(product.name);
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success('Producto agregado al carrito', { description: product.name });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/resumen-pedido');
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Cantidad:</label>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          -
        </Button>
        <span className="w-12 text-center font-semibold text-lg">
          {quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(quantity + 1)}
        >
          +
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="flex-1 bg-pink-500 hover:bg-pink-600"
          onClick={handleAddToCart}
          disabled={addedToCart}
        >
          {addedToCart ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Agregar al carrito
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
          onClick={handleBuyNow}
        >
          Cotizar ahora
        </Button>
      </div>
    </div>
  );
}
