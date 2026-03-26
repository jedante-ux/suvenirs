'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { addSearchToHistory } from '@/lib/searchHistory';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Save to search history on mount
  if (typeof window !== 'undefined') {
    addSearchToHistory(product.name);
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'}`, {
      description: product.name,
    });
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/resumen-pedido');
  };

  return (
    <div className="space-y-4">
      {/* Quantity selector — always visible */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Cantidad:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            aria-label="Cantidad"
            value={quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) setQuantity(v);
              else if (e.target.value === '') setQuantity(1);
            }}
            className="w-16 h-10 text-center text-base font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setQuantity(q => q + 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar al carrito
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={handleBuyNow}
        >
          Cotizar ahora
        </Button>
      </div>
    </div>
  );
}
