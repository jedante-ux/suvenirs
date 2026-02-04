'use client';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatDescription } from '@/lib/utils';
import { ShoppingBag, Edit2, MessageCircle, ArrowLeft, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const WHATSAPP_NUMBER = '56937194618'; // Número de WhatsApp de la empresa

export default function ResumenPedidoPage() {
  const { state, getTotalItems, openCart } = useCart();
  const router = useRouter();

  const generateWhatsAppMessage = () => {
    let message = '¡Hola! Me gustaría solicitar una cotización para los siguientes productos:\n\n';

    state.items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   ID: ${item.product.productId}\n`;
      message += `   Cantidad: ${item.quantity} unidades\n`;
      message += `   Descripción: ${formatDescription(item.product.description)}\n\n`;
    });

    message += `---\n`;
    message += `*Total de productos:* ${state.items.length}\n`;
    message += `*Total de unidades:* ${getTotalItems()}\n\n`;
    message += `Quedo atento/a a su respuesta. ¡Gracias!`;

    return message;
  };

  const handleWhatsAppRedirect = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEdit = () => {
    openCart();
  };

  if (state.items.length === 0) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
            <p className="text-muted-foreground mb-8">
              Agrega productos a tu carrito para solicitar una cotización.
            </p>
            <Button asChild size="lg">
              <Link href="/productos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ver Productos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-muted/30">
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/productos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Productos
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold">Resumen del Pedido</h1>
          <p className="text-muted-foreground mt-2">
            Revisa tu pedido antes de solicitar la cotización
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({state.items.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item, index) => (
                  <div key={item.product._id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.image || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">{item.product.productId}</p>
                            <h3 className="font-semibold text-lg">{item.product.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                              {formatDescription(item.product.description)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            x{item.quantity}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Cantidad solicitada: {item.quantity} unidades</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Productos diferentes</span>
                    <span className="font-medium">{state.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de unidades</span>
                    <span className="font-medium">{getTotalItems()}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">Detalle del pedido:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {state.items.map((item) => (
                      <li key={item.product._id} className="flex justify-between items-start">
                        <div className="truncate mr-2">
                          <span className="font-mono text-xs block">{item.product.productId}</span>
                          <span>{item.product.name}</span>
                        </div>
                        <span className="flex-shrink-0">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleWhatsAppRedirect}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Cotizar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleEdit}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar Pedido
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Al hacer clic en &quot;Cotizar por WhatsApp&quot; serás redirigido a WhatsApp con el detalle de tu pedido.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
