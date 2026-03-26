'use client';

import { useState, useRef, useEffect } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Show full label "Agregar al carrito" instead of just "Agregar" */
  fullLabel?: boolean;
}

export default function AddToCartButton({ product, className = '', size = 'default', fullLabel = false }: AddToCartButtonProps) {
  const { addItem, getItemQuantity } = useCart();
  const [isSelecting, setIsSelecting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [inputValue, setInputValue] = useState('1');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inCart = getItemQuantity(product.id);

  // Close on click outside
  useEffect(() => {
    if (!isSelecting) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelecting(false);
        setQuantity(1);
        setInputValue('1');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSelecting]);

  // Focus input when selector opens
  useEffect(() => {
    if (isSelecting && inputRef.current) {
      inputRef.current.select();
    }
  }, [isSelecting]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelecting(true);
    setQuantity(1);
    setInputValue('1');
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, quantity);
    setIsSelecting(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
    toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'}`, {
      description: product.name,
    });
    setQuantity(1);
    setInputValue('1');
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const n = Math.max(1, quantity - 1);
    setQuantity(n);
    setInputValue(String(n));
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const n = quantity + 1;
    setQuantity(n);
    setInputValue(String(n));
  };

  const commitInput = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) {
      setQuantity(n);
      setInputValue(String(n));
    } else {
      setInputValue(String(quantity));
    }
  };

  // Confirmed state
  if (justAdded) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <Button
          size={size}
          className="w-full bg-green-600 hover:bg-green-600 text-white cursor-default transition-all duration-200"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Check className="mr-2 h-4 w-4" />
          Agregado
        </Button>
      </div>
    );
  }

  // Quantity selector state
  if (isSelecting) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div
          className="flex items-center w-full rounded-md border border-primary/40 bg-white overflow-hidden transition-all duration-200"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            type="button"
            className="flex items-center justify-center h-9 w-9 flex-shrink-0 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
            onClick={handleMinus}
            disabled={quantity <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            ref={inputRef}
            type="number"
            min={1}
            aria-label="Cantidad"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={(e) => commitInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitInput(inputValue);
                handleConfirm(e as unknown as React.MouseEvent);
              }
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="flex-1 min-w-0 h-9 text-center text-sm font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            className="flex items-center justify-center h-9 w-9 flex-shrink-0 text-primary hover:bg-primary/10 transition-colors"
            onClick={handlePlus}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center h-9 px-3 flex-shrink-0 bg-primary text-white hover:bg-primary/90 transition-colors"
            onClick={handleConfirm}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default button state
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        size={size}
        className="w-full cursor-pointer hover:scale-[1.03] transition-all duration-200"
        onClick={handleOpen}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {fullLabel ? 'Agregar al carrito' : 'Agregar'}
      </Button>
      {inCart > 0 && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 min-w-5 px-1 text-[10px] font-bold bg-primary text-white rounded-full ring-2 ring-white shadow-sm">
          {inCart}
        </span>
      )}
    </div>
  );
}
