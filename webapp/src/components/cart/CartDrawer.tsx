'use client';

import { useCart, cartItemKey } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { CartItem } from '@/types';

function itemKey(item: CartItem): string {
  return cartItemKey(item.product.id, item.variant);
}

function QuantityInput({ value, onUpdate }: { value: number; onUpdate: (n: number) => void }) {
  const [input, setInput] = useState(String(value));

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) {
      onUpdate(n);
      setInput(String(n));
    } else {
      setInput(String(value));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 flex-shrink-0 rounded-lg border-primary/30 hover:bg-primary/5 hover:border-primary/50"
        onClick={() => { const n = value - 1; onUpdate(n); setInput(String(n <= 0 ? value : n)); }}
        disabled={value <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <input
        type="number"
        min={1}
        aria-label="Cantidad"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(input)}
        className="w-12 h-8 text-center text-sm font-semibold border border-input rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 flex-shrink-0 rounded-lg border-primary/30 hover:bg-primary/5 hover:border-primary/50"
        onClick={() => { const n = value + 1; onUpdate(n); setInput(String(n)); }}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function CartDrawer() {
  const { state, closeCart, removeItem, updateQuantity, clearCart, getTotalItems } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Auto-select all items when cart changes
  useEffect(() => {
    setSelected(new Set(state.items.map(i => itemKey(i))));
  }, [state.items]);

  const allSelected = state.items.length > 0 && selected.size === state.items.length;

  const toggleItem = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(state.items.map(i => itemKey(i))));
  };

  const selectedItems = state.items.filter(i => selected.has(itemKey(i)));
  const selectedUnits = selectedItems.reduce((s, i) => s + i.quantity, 0);

  const handleNext = () => {
    // Remove unselected items before navigating
    state.items.forEach(item => {
      if (!selected.has(itemKey(item))) {
        removeItem(itemKey(item));
      }
    });
    closeCart();
    router.push('/resumen-pedido');
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Carrito
            {getTotalItems() > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                {getTotalItems()} {getTotalItems() === 1 ? 'unidad' : 'unidades'}
              </span>
            )}
          </SheetTitle>
          {state.items.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={toggleAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'} ({selected.size}/{state.items.length})
              </label>
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground mb-1">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground mb-6">Agrega productos para comenzar tu cotización</p>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5" onClick={closeCart}>
                Ver productos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {state.items.map((item, index) => {
                const key = itemKey(item);
                const imgSrc = item.variant?.image || item.product.images?.[0] || '/placeholder-product.jpg';
                const variantLabel = item.variant
                  ? Object.values(item.variant.attributes).join(' / ')
                  : null;
                return (
                <div
                  key={key}
                  className={`flex gap-3 p-3 rounded-xl border transition-colors ${selected.has(key) ? 'bg-muted/40 border-border/50' : 'bg-muted/20 border-border/30 opacity-60'} ${index < 5 ? 'animate-cart-item-in' : ''}`}
                  style={index < 5 ? { animationDelay: `${index * 0.05}s`, opacity: 0 } : undefined}
                >
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={selected.has(key)}
                      onCheckedChange={() => toggleItem(key)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {/* Image */}
                  <div className="relative w-18 h-18 min-w-[72px] min-h-[72px] bg-white rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                    <Image
                      src={imgSrc}
                      alt={item.product.name}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground/70 font-mono tracking-wide uppercase leading-none mb-0.5">
                      {item.variant?.sku || item.product.productId}
                    </p>
                    <h4 className="font-medium text-sm leading-snug line-clamp-2">{item.product.name}</h4>
                    {variantLabel && (
                      <p className="text-xs text-primary font-medium mt-0.5">{variantLabel}</p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <QuantityInput
                        value={item.quantity}
                        onUpdate={(n) => updateQuantity(key, n)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => removeItem(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="flex-shrink-0 px-6 pt-4 pb-6 border-t bg-background space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
              <span className="text-sm font-medium text-foreground">Seleccionados</span>
              <span className="text-xl font-bold text-primary tabular-nums">{selectedItems.length} prod. · {selectedUnits} uds.</span>
            </div>

            {/* Actions */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              size="lg"
              onClick={handleNext}
              disabled={selected.size === 0}
            >
              Cotizar seleccionados ({selectedItems.length})
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                  clearCart();
                }
              }}
            >
              Vaciar Carrito
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
