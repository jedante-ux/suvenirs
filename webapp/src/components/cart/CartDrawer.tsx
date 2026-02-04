'use client';

import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDescription } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { state, closeCart, removeItem, updateQuantity, clearCart, getTotalItems } = useCart();
  const router = useRouter();

  const handleNext = () => {
    closeCart();
    router.push('/resumen-pedido');
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrito ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col h-[calc(100vh-160px)]">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tu carrito está vacío</p>
              <Button variant="outline" className="mt-4" onClick={closeCart}>
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
                {state.items.map((item) => (
                  <div key={item.product._id} className="flex gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono">{item.product.productId}</p>
                      <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                        {formatDescription(item.product.description)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Stock disponible: {item.product.quantity}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 mt-4 pt-4 border-t bg-background">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total de items</span>
                    <span className="text-lg font-semibold">{getTotalItems()}</span>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full" size="lg" onClick={handleNext}>
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearCart}
                    >
                      Vaciar Carrito
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
