'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDescription } from '@/lib/utils';
import { ShoppingBag, Edit2, MessageCircle, ArrowLeft, Package, Loader2, Truck, ClipboardList, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_NUMBER = '56931464930';

export default function ResumenPedidoPage() {
  const { state, getTotalItems, openCart } = useCart();
  const router = useRouter();
  const [quoteToken, setQuoteToken] = useState<string | null>(null);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [shippingZone, setShippingZone] = useState<'santiago' | 'regiones'>('santiago');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'form' | 'loading' | 'success'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const canSubmit = customerCompany.trim().length > 0 && (!shippingEnabled || customerAddress.trim().length > 0);

  const generateWhatsAppMessage = () => {
    let message = '¡Hola! Me gustaría cotizar los siguientes productos:\n\n';

    state.items.forEach((item, index) => {
      const sku = item.variant?.sku || item.product.productId;
      const variantLabel = item.variant
        ? ' — ' + Object.values(item.variant.attributes as Record<string, string>).join(' / ')
        : '';
      message += `${index + 1}. ${item.product.name}${variantLabel} (SKU: ${sku}) — ${item.quantity} uds.\n`;
    });

    message += `\n📦 Total: ${state.items.length} producto${state.items.length !== 1 ? 's' : ''}, ${getTotalItems()} unidades\n`;
    if (shippingEnabled) {
      message += `🚚 Despacho: ${shippingZone === 'santiago' ? 'Santiago' : 'Regiones'}\n`;
    }
    if (customerAddress.trim()) {
      message += `📍 Dirección: ${customerAddress.trim()}\n`;
    }
    message += `\nQuedo atento/a a su respuesta. ¡Gracias!`;

    return message;
  };

  const handleConfirmAndSend = async () => {
    setModalStep('loading');
    const message = generateWhatsAppMessage();

    const [quoteRes] = await Promise.all([
      fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'whatsapp',
          customerName: customerName.trim() || null,
          customerCompany: customerCompany.trim() || null,
          customerEmail: customerEmail.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerAddress: customerAddress.trim() || null,
          notes: null,
          shippingService: shippingEnabled ? shippingZone : null,
          items: state.items.map((item) => ({
            productId: item.product.productId,
            productName: item.product.name,
            variantSku: item.variant?.sku || null,
            variantLabel: item.variant
              ? Object.values(item.variant.attributes as Record<string, string>).join(' / ')
              : null,
            quantity: item.quantity,
            description: item.product.description || '',
          })),
        }),
      }).then((r) => r.json()).catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    if (quoteRes?.success && quoteRes?.data?.publicToken) {
      setQuoteToken(quoteRes.data.publicToken);
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    setModalStep('success');
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
    <>
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
                {state.items.map((item, index) => {
                  const imgSrc = item.variant?.image || item.product.images?.[0] || '/placeholder-product.jpg';
                  const variantLabel = item.variant
                    ? Object.values(item.variant.attributes as Record<string, string>).join(' / ')
                    : null;
                  const itemSku = item.variant?.sku || item.product.productId;
                  return (
                  <div key={`${item.product.id}-${item.variant?.sku || 'base'}`}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={imgSrc}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">{itemSku}</p>
                            <h3 className="font-semibold text-lg">{item.product.name}</h3>
                            {variantLabel && (
                              <p className="text-sm text-primary font-medium">{variantLabel}</p>
                            )}
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
                  );
                })}
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
                      <li key={item.product.id} className="flex justify-between items-start">
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

                {/* Shipping */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shipping-switch" className="flex items-center gap-2 cursor-pointer">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Servicio de despacho</span>
                    </Label>
                    <Switch
                      id="shipping-switch"
                      checked={shippingEnabled}
                      onCheckedChange={setShippingEnabled}
                    />
                  </div>
                  {shippingEnabled && (
                    <>
                      <Select value={shippingZone} onValueChange={(v) => setShippingZone(v as 'santiago' | 'regiones')}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="santiago">Santiago</SelectItem>
                          <SelectItem value="regiones">Regiones</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-1.5">
                        <Label htmlFor="shipping-address" className="text-sm">
                          Dirección de despacho <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shipping-address"
                          type="text"
                          placeholder="Ej: Av. Providencia 1234, Santiago"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                        {!customerAddress.trim() && (
                          <p className="text-xs text-red-500">Debes ingresar una dirección para el despacho</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => { setModalStep('form'); setPhoneModalOpen(true); }}
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

    {/* Contact Modal */}
    <Dialog open={phoneModalOpen} onOpenChange={modalStep === 'form' ? setPhoneModalOpen : undefined}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => modalStep !== 'form' && e.preventDefault()}>
        {modalStep === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-center">Contactando a un Ejecutivo de ventas...</p>
            <p className="text-sm text-muted-foreground text-center">Por favor espera un momento</p>
          </div>
        )}

        {modalStep === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <h2 className="text-xl font-bold">Cotización solicitada</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Tu solicitud fue registrada exitosamente. WhatsApp se abrió en una nueva ventana con el detalle de tu pedido para que puedas enviarlo directamente a nuestro equipo.
              </p>
            </div>
            {quoteToken ? (
              <Button
                className="w-full mt-2"
                size="lg"
                onClick={() => {
                  setPhoneModalOpen(false);
                  router.push(`/cotizacion/${quoteToken}`);
                }}
              >
                Ver detalle de cotización
              </Button>
            ) : (
              <Button
                className="w-full mt-2"
                variant="outline"
                size="lg"
                onClick={() => setPhoneModalOpen(false)}
              >
                Cerrar
              </Button>
            )}
          </div>
        )}

        {modalStep === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Completar cotización
              </DialogTitle>
              <DialogDescription>
                Ingresa tus datos para registrar la solicitud.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nombre y apellido</Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-company">Empresa <span className="text-red-500">*</span></Label>
                <Input
                  id="customer-company"
                  type="text"
                  placeholder="Ej: Minera Los Andes"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Correo electrónico</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Ej: juan@empresa.cl"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Número de WhatsApp</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="Ej: +56 9 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-address">
                  Dirección de despacho
                  {shippingEnabled
                    ? <span className="text-red-500"> *</span>
                    : <span className="text-muted-foreground font-normal"> (opcional)</span>
                  }
                </Label>
                <Input
                  id="customer-address"
                  type="text"
                  placeholder="Ej: Av. Providencia 1234, Santiago"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleConfirmAndSend()}
                />
              </div>
              <Button className="w-full" size="lg" onClick={handleConfirmAndSend} disabled={!canSubmit}>
                <MessageCircle className="mr-2 h-5 w-5" />
                Continuar a WhatsApp
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
