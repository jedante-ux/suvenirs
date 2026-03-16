'use client';

import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
        max={max}
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

  const handleNext = () => {
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
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
              </span>
            )}
          </SheetTitle>
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
              {state.items.map((item) => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                  {/* Image */}
                  <div className="relative w-18 h-18 min-w-[72px] min-h-[72px] bg-white rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                    <Image
                      src={item.product.image || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground/70 font-mono tracking-wide uppercase leading-none mb-0.5">
                      {item.product.productId}
                    </p>
                    <h4 className="font-medium text-sm leading-snug line-clamp-2">{item.product.name}</h4>
                    <div className="flex items-center justify-between mt-2.5">
                      <QuantityInput
                        value={item.quantity}
                        onUpdate={(n) => updateQuantity(item.product.id, n)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="flex-shrink-0 px-6 pt-4 pb-6 border-t bg-background space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
              <span className="text-sm font-medium text-foreground">Total de items</span>
              <span className="text-xl font-bold text-primary tabular-nums">{getTotalItems()}</span>
            </div>

            {/* Actions */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              size="lg"
              onClick={handleNext}
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
              onClick={clearCart}
            >
              Vaciar Carrito
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
