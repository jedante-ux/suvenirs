'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Kit } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Boxes,
  MessageCircle,
  Loader2,
  ClipboardList,
  CheckCircle,
  ArrowLeft,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_NUMBER = '56931464930';

export default function KitsPage() {
  const router = useRouter();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-kit selected tier
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});

  // Quote modal state
  const [quoteKit, setQuoteKit] = useState<Kit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'form' | 'loading' | 'success'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [quoteToken, setQuoteToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchKits = async () => {
      try {
        const res = await fetch('/api/kits');
        const data = await res.json();
        if (data.success) {
          setKits(data.data);
          // Default tier selection: first tier of each kit
          const defaults: Record<string, number> = {};
          data.data.forEach((kit: Kit) => {
            if (kit.tiers.length > 0) {
              defaults[kit.id] = kit.tiers[0];
            }
          });
          setSelectedTiers(defaults);
        }
      } catch (error) {
        console.error('Error fetching kits:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKits();
  }, []);

  const selectTier = (kitId: string, tier: number) => {
    setSelectedTiers((prev) => ({ ...prev, [kitId]: tier }));
  };

  const openQuoteModal = (kit: Kit) => {
    setQuoteKit(kit);
    setModalStep('form');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setQuoteToken(null);
    setModalOpen(true);
  };

  const generateWhatsAppMessage = (kit: Kit, tier: number) => {
    let message = `¡Hola! Me gustaría cotizar el siguiente kit:\n\n`;
    message += `🎁 Kit: ${kit.name}\n`;
    message += `📦 Cantidad por producto: ${tier} unidades\n\n`;
    message += `Productos incluidos:\n`;

    kit.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name} (SKU: ${item.product.productId}) — ${tier} uds.\n`;
    });

    const totalUnits = kit.items.length * tier;
    message += `\n📊 Total: ${kit.items.length} productos, ${totalUnits} unidades\n`;
    message += `\nQuedo atento/a a su respuesta. ¡Gracias!`;

    return message;
  };

  const handleConfirmAndSend = async () => {
    if (!quoteKit) return;
    const tier = selectedTiers[quoteKit.id];

    setModalStep('loading');
    const message = generateWhatsAppMessage(quoteKit, tier);

    const [quoteRes] = await Promise.all([
      fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'KIT',
          kitId: quoteKit.id,
          customerName: customerName.trim() || null,
          customerEmail: customerEmail.trim() || null,
          customerPhone: customerPhone.trim() || null,
          notes: `Kit: ${quoteKit.name} - ${tier} unidades por producto`,
          items: quoteKit.items.map((item) => ({
            productId: item.product.productId,
            productName: item.product.name,
            quantity: tier,
            description: item.product.description || '',
          })),
        }),
      })
        .then((r) => r.json())
        .catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    if (quoteRes?.success && quoteRes?.data?.publicToken) {
      setQuoteToken(quoteRes.data.publicToken);
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    setModalStep('success');
  };

  return (
    <>
      <div className="pt-20 min-h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-12 md:py-16">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <Boxes className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Kits Corporativos</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Combos pre-armados de productos ideales para eventos corporativos, onboarding y
              regalos empresariales. Elige la cantidad que necesites y cotiza al instante.
            </p>
          </div>
        </div>

        {/* Kits Grid */}
        <div className="container py-8 md:py-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : kits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Boxes className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
              <p className="text-muted-foreground">
                Estamos preparando kits corporativos increíbles para ti.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map((kit) => {
                const selectedTier = selectedTiers[kit.id] || kit.tiers[0];
                const totalUnits = kit.items.length * selectedTier;

                return (
                  <Card key={kit.id} className="overflow-hidden flex flex-col">
                    {/* Kit Image or Product Thumbnails */}
                    {kit.image ? (
                      <div className="relative w-full aspect-[16/10] bg-muted">
                        <Image
                          src={kit.image}
                          alt={kit.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5 bg-muted">
                        {kit.items.slice(0, 4).map((item) => (
                          <div key={item.id} className="relative aspect-square bg-white">
                            <Image
                              src={item.product.images?.[0] || '/placeholder-product.jpg'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <CardContent className="flex-1 flex flex-col p-5">
                      {/* Kit Name & Description */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-1">{kit.name}</h3>
                        {kit.description && (
                          <p className="text-sm text-muted-foreground">{kit.description}</p>
                        )}
                      </div>

                      {/* Products List */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Incluye {kit.items.length} productos:
                        </p>
                        {kit.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted">
                              <Image
                                src={item.product.images?.[0] || '/placeholder-product.jpg'}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm truncate">{item.product.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tier Selector */}
                      <div className="mb-4 mt-auto">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Cantidad por producto:
                        </p>
                        <div className="flex gap-2">
                          {kit.tiers.map((tier) => (
                            <button
                              key={tier}
                              onClick={() => selectTier(kit.id, tier)}
                              className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                selectedTier === tier
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                              }`}
                            >
                              {tier} uds
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Total: {kit.items.length} productos x {selectedTier} uds ={' '}
                          <span className="font-semibold text-foreground">{totalUnits} unidades</span>
                        </p>
                      </div>

                      {/* CTA */}
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => openQuoteModal(kit)}
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Cotizar este Kit
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={modalStep === 'form' ? setModalOpen : undefined}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => modalStep !== 'form' && e.preventDefault()}
        >
          {modalStep === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base font-medium text-center">
                Contactando a un Ejecutivo de ventas...
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Por favor espera un momento
              </p>
            </div>
          )}

          {modalStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
              <CheckCircle className="h-14 w-14 text-green-500" />
              <div>
                <h2 className="text-xl font-bold">Cotización solicitada</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  Tu solicitud fue registrada exitosamente. WhatsApp se abrió en una nueva
                  ventana con el detalle de tu kit.
                </p>
              </div>
              {quoteToken ? (
                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={() => {
                    setModalOpen(false);
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
                  onClick={() => setModalOpen(false)}
                >
                  Cerrar
                </Button>
              )}
            </div>
          )}

          {modalStep === 'form' && quoteKit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Cotizar Kit
                </DialogTitle>
                <DialogDescription>
                  Ingresa tus datos para cotizar el kit seleccionado.
                </DialogDescription>
              </DialogHeader>

              {/* Kit summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{quoteKit.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedTiers[quoteKit.id]} uds c/u
                  </Badge>
                </div>
                <div className="space-y-1">
                  {quoteKit.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span className="truncate">{item.product.name}</span>
                      <span className="ml-auto flex-shrink-0">x{selectedTiers[quoteKit.id]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-right">
                  Total: {quoteKit.items.length * selectedTiers[quoteKit.id]} unidades
                </p>
              </div>

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
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmAndSend()}
                  />
                </div>
                <Button className="w-full" size="lg" onClick={handleConfirmAndSend}>
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
