'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Quote, QuoteItem, StampingType, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Eye, Loader2, MessageCircle, Trash2, Pencil, Link2, Check, Minus, Plus, Truck, RefreshCw, FileText, User, Package, Search, PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getStatusBadgeClass, getStatusLabel, QUOTE_STATUSES } from '@/lib/statusBadge';

const QuotePDFPreview = dynamic(
  () => import('@/components/pdf/QuotePDFPreview').then(m => m.QuotePDFPreview),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Cargando preview...</div> }
);

const sourceLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  WEB: 'Web',
  MANUAL: 'Manual',
};

interface EditForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  notes: string;
  shippingService: string;
  shippingPrice: string;
  stampingTypeId: string;
  stampingPrice: string;
  status: string;
  items: QuoteItem[];
}

export default function CotizacionesPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    customerName: '', customerEmail: '', customerPhone: '',
    customerCompany: '', notes: '', shippingService: '', shippingPrice: '',
    stampingTypeId: '', stampingPrice: '',
    status: 'PENDING', items: [],
  });
  const [stampingTypes, setStampingTypes] = useState<StampingType[]>([]);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);

  const fetchQuotes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/quotes' : `/api/quotes?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setQuotes(result.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchQuotes();
      fetch('/api/stamping-types').then(r => r.json()).then(r => { if (r.success) setStampingTypes(r.data); });
    }
  }, [authLoading, statusFilter]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchQuotes(true);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [statusFilter]);

  const updateStatus = async (quoteId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus as Quote['status'] } : q));
        if (selectedQuote?.id === quoteId) setSelectedQuote({ ...selectedQuote, status: newStatus as Quote['status'] });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openEdit = async (quote: Quote) => {
    setSelectedQuote(quote);
    setEditOpen(true);

    // Fill form immediately with existing data
    let items = quote.items.map(i => ({ ...i }));

    // For items without unitPrice, fetch from products API
    const missingPrice = items.filter(i => !i.unitPrice);
    if (missingPrice.length > 0) {
      try {
        const ids = missingPrice.map(i => i.productId).join(',');
        const res = await fetch(`/api/products/prices?ids=${ids}`);
        const result = await res.json();
        if (result.success) {
          const priceMap = new Map<string, number>(
            result.data.map((p: { productId: string; price: number }) => [p.productId, p.price])
          );
          items = items.map(i => ({
            ...i,
            unitPrice: i.unitPrice || priceMap.get(i.productId) || 0,
          }));
        }
      } catch {}
    }

    setEditForm({
      customerName: quote.customerName || '',
      customerEmail: quote.customerEmail || '',
      customerPhone: quote.customerPhone || '',
      customerCompany: quote.customerCompany || '',
      notes: quote.notes || '',
      shippingService: quote.shippingService || '',
      shippingPrice: quote.shippingPrice > 0 ? String(quote.shippingPrice) : '',
      stampingTypeId: quote.stampingTypeId || '',
      stampingPrice: quote.stampingPrice > 0 ? String(quote.stampingPrice) : '',
      status: quote.status,
      items,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedQuote) return;
    setSaving(true);
    try {
      const items = editForm.items.filter(i => i.quantity > 0);
      const res = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerName: editForm.customerName || null,
          customerEmail: editForm.customerEmail || null,
          customerPhone: editForm.customerPhone || null,
          customerCompany: editForm.customerCompany || null,
          notes: editForm.notes || null,
          shippingService: editForm.shippingService || null,
          shippingPrice: editForm.shippingPrice ? parseFloat(editForm.shippingPrice) : 0,
          stampingTypeId: editForm.stampingTypeId || null,
          stampingPrice: editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : 0,
          status: editForm.status,
          quotedAmount: (() => {
            const neto = items.reduce((s: any, i: any) => s + (i.unitPrice || 0) * i.quantity, 0)
              + (editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : 0);
            return neto;
          })(),
          finalAmount: (() => {
            const stampingVal = editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : 0;
            const shippingVal = editForm.shippingPrice ? parseFloat(editForm.shippingPrice) : 0;
            const totalUnits = items.reduce((s: any, i: any) => s + i.quantity, 0);
            const stampingPerUnit = totalUnits > 0 ? stampingVal / totalUnits : 0;
            const neto = items.reduce((s: any, i: any) => s + (i.unitPrice || 0) * i.quantity, 0) + stampingVal;
            const sumaUnitarios = items.reduce((s: any, i: any) =>
              s + Math.round((i.unitPrice || 0) + stampingPerUnit) * i.quantity, 0);
            const ganancia = Math.round(sumaUnitarios * 0.5);
            return Math.round((neto + ganancia) * 1.19) + shippingVal;
          })(),
          items,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setQuotes(quotes.map(q => q.id === selectedQuote.id ? result.data : q));
        setEditOpen(false);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quoteToDelete) return;
    try {
      const res = await fetch(`/api/quotes/${quoteToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const copyPublicLink = (quote: Quote) => {
    const url = `${window.location.origin}/cotizacion/${quote.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsApp = (quote: Quote) => {
    const phone = quote.customerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(
      `Hola ${quote.customerName || ''}, con respecto a su cotización ${quote.quoteNumber}...`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const searchProducts = async (query: string) => {
    setProductSearch(query);
    if (!query.trim()) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10&page=1`);
      const result = await res.json();
      if (result.success) setProductResults(result.data);
    } catch {} finally {
      setSearchingProducts(false);
    }
  };

  const resetAddProduct = () => {
    setAddProductOpen(false);
    setProductSearch('');
    setProductResults([]);
    setSelectedProduct(null);
    setSelectedQty(1);
  };

  const confirmAddProduct = () => {
    if (!selectedProduct) return;
    const qty = Math.max(1, selectedQty);
    const existing = editForm.items.findIndex(i => i.productId === selectedProduct.productId);
    if (existing >= 0) {
      const items = [...editForm.items];
      items[existing] = { ...items[existing], quantity: items[existing].quantity + qty };
      setEditForm({ ...editForm, items });
    } else {
      const newItem: QuoteItem = {
        id: `new-${Date.now()}`,
        productId: selectedProduct.productId,
        productName: selectedProduct.name,
        quantity: qty,
        unitPrice: selectedProduct.price || 0,
        description: selectedProduct.description || '',
      };
      setEditForm({ ...editForm, items: [...editForm.items, newItem] });
    }
    resetAddProduct();
  };

  const updateItemQty = (index: number, qty: number) => {
    const items = [...editForm.items];
    items[index] = { ...items[index], quantity: Math.max(0, qty) };
    setEditForm({ ...editForm, items });
  };

  const removeItem = (index: number) => {
    setEditForm({ ...editForm, items: editForm.items.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las solicitudes de cotización</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setRefreshing(true); fetchQuotes(true); }}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filtrar por estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {QUOTE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>{getStatusLabel(value)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Productos</TableHead>
                <TableHead className="text-center">Unidades</TableHead>
                <TableHead className="text-center">Origen</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-sm">{quote.quoteNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.customerName || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">{quote.customerEmail || quote.customerPhone || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{quote.totalItems}</TableCell>
                  <TableCell className="text-center">{quote.totalUnits}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{sourceLabels[quote.source] ?? quote.source}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select value={quote.status} onValueChange={(value) => updateStatus(quote.id, value)}>
                      <SelectTrigger className="w-32">
                        <Badge className={getStatusBadgeClass(quote.status)}>{getStatusLabel(quote.status)}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((value) => (
                          <SelectItem key={value} value={value}>{getStatusLabel(value)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{new Date(quote.createdAt).toLocaleDateString('es-CL')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Editar cotización"
                        onClick={() => openEdit(quote)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500"
                        onClick={() => { setQuoteToDelete(quote); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-16">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No se encontraron cotizaciones</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cotización {selectedQuote?.quoteNumber}</DialogTitle>
            <DialogDescription>Detalles completos de la solicitud</DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Cliente</p><p className="font-medium">{selectedQuote.customerName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Empresa</p><p className="font-medium">{selectedQuote.customerCompany || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{selectedQuote.customerEmail || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{selectedQuote.customerPhone || '-'}</p></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Productos solicitados</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{item.productId}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice > 0
                              ? `$${item.unitPrice.toLocaleString('es-CL')}`
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.unitPrice > 0
                              ? `$${(item.unitPrice * item.quantity).toLocaleString('es-CL')}`
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {selectedQuote.finalAmount > 0 && (() => {
                const neto = selectedQuote.quotedAmount;
                const ganancia = Math.round(neto * 0.5);
                const base = neto + ganancia;
                const iva = Math.round(base * 0.19);
                const shipping = selectedQuote.shippingPrice ?? 0;
                const total = selectedQuote.finalAmount;
                return (
                  <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal neto</span>
                      <span className="font-medium">${neto.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ganancia (50%)</span>
                      <span className="font-medium text-emerald-600">${ganancia.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>Base</span>
                      <span>${(neto + ganancia).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (19%)</span>
                      <span className="font-medium">${iva.toLocaleString('es-CL')}</span>
                    </div>
                    {shipping > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">
                          Despacho{selectedQuote.shippingService ? ` (${selectedQuote.shippingService === 'santiago' ? 'Santiago' : 'Regiones'})` : ''}
                        </span>
                        <span className="font-medium">${shipping.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">${total.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div><p className="text-sm text-muted-foreground">Total productos</p><p className="text-xl font-bold">{selectedQuote.totalItems}</p></div>
                <div className="text-right"><p className="text-sm text-muted-foreground">Total unidades</p><p className="text-xl font-bold">{selectedQuote.totalUnits}</p></div>
              </div>
              {selectedQuote.shippingService && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Servicio de despacho</p>
                    <p className="text-sm font-medium capitalize">{selectedQuote.shippingService === 'santiago' ? 'Santiago' : 'Regiones'}</p>
                  </div>
                </div>
              )}
              {selectedQuote.notes && (
                <div><p className="text-sm text-muted-foreground mb-1">Notas</p><p className="text-sm p-3 bg-muted rounded-lg">{selectedQuote.notes}</p></div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Select value={selectedQuote.status} onValueChange={(v) => updateStatus(selectedQuote.id, v)}>
                    <SelectTrigger className="w-40 mt-1">
                      <Badge className={getStatusBadgeClass(selectedQuote.status)}>{getStatusLabel(selectedQuote.status)}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTE_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>{getStatusLabel(value)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => copyPublicLink(selectedQuote)} className="gap-2">
                    {copiedId === selectedQuote.id ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
                    {copiedId === selectedQuote.id ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  {selectedQuote.customerPhone && (
                    <Button onClick={() => openWhatsApp(selectedQuote)} className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b flex-shrink-0">
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold">
                Editar Cotización <span className="text-primary font-mono">{selectedQuote?.quoteNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Modifica los datos del cliente, productos y valores.
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {selectedQuote && (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyPublicLink(selectedQuote)}>
                    {copiedId === selectedQuote.id ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Link2 className="mr-2 h-4 w-4" />}
                    {copiedId === selectedQuote.id ? 'Copiado' : 'Enlace'}
                  </Button>
                  {(editForm.customerPhone || selectedQuote.customerPhone) && (
                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => openWhatsApp({ ...selectedQuote, customerPhone: editForm.customerPhone || selectedQuote.customerPhone, customerName: editForm.customerName || selectedQuote.customerName })}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button variant="outline" size="sm" onClick={() => setPdfPreviewOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>

          {/* Tabs body */}
          <Tabs defaultValue="cliente" className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-5 border-b flex-shrink-0">
              <TabsList className="h-10 bg-transparent p-0 gap-1">
                <TabsTrigger value="cliente" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3">
                  <User className="h-3.5 w-3.5" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="productos" className="gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-3">
                  <Package className="h-3.5 w-3.5" />
                  Productos y precios
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1 — Cliente & facturación */}
            <TabsContent value="cliente" className="overflow-y-auto p-5 lg:p-6 space-y-5 flex-1 mt-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="edit-name">Nombre completo</Label>
                  <Input id="edit-name" value={editForm.customerName}
                    onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="edit-company">Empresa</Label>
                  <Input id="edit-company" value={editForm.customerCompany}
                    onChange={e => setEditForm({ ...editForm, customerCompany: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editForm.customerEmail}
                    onChange={e => setEditForm({ ...editForm, customerEmail: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-phone">Teléfono / WhatsApp</Label>
                  <Input id="edit-phone" value={editForm.customerPhone}
                    onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })} />
                </div>
              </div>

              <div className="border-t pt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Despacho</p>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Servicio de despacho
                  </Label>
                  <Switch
                    checked={!!editForm.shippingService}
                    onCheckedChange={(v) => setEditForm({ ...editForm, shippingService: v ? 'santiago' : '' })}
                  />
                </div>
                {editForm.shippingService && (
                  <div className="space-y-3">
                    <Select value={editForm.shippingService} onValueChange={(v) => setEditForm({ ...editForm, shippingService: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="santiago">Santiago</SelectItem>
                        <SelectItem value="regiones">Regiones</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-1">
                      <Label className="text-xs">Costo de despacho (CLP)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number" min="0"
                          className="h-8"
                          placeholder="Ej: 5.000"
                          value={editForm.shippingPrice}
                          onChange={e => setEditForm({ ...editForm, shippingPrice: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</p>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger>
                    <Badge className={getStatusBadgeClass(editForm.status)}>{getStatusLabel(editForm.status)}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>{getStatusLabel(value)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notas internas</p>
                <Textarea id="edit-notes" rows={4} placeholder="Observaciones, instrucciones especiales..."
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </TabsContent>

            {/* TAB 2 — Productos & precios */}
            <TabsContent value="productos" className="overflow-y-auto p-5 lg:p-6 flex flex-col gap-5 flex-1 mt-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Productos ({editForm.items.length})
                </p>
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => { setProductSearch(''); setProductResults([]); setAddProductOpen(true); }}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Agregar producto
                </Button>
              </div>

              <div className="border rounded-lg divide-y flex-1">
                {editForm.items.map((item, index) => {
                  const subtotal = (item.unitPrice || 0) * item.quantity;
                  return (
                    <div key={item.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-mono leading-none mb-0.5">{item.productId}</p>
                          <p className="text-sm font-medium leading-snug">{item.productName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 flex-shrink-0 -mt-0.5"
                          onClick={() => removeItem(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Qty */}
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7"
                            onClick={() => updateItemQty(index, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number" min="0"
                            className="w-14 h-7 text-center text-sm"
                            value={item.quantity}
                            onChange={e => updateItemQty(index, parseInt(e.target.value) || 0)}
                          />
                          <Button variant="outline" size="icon" className="h-7 w-7"
                            onClick={() => updateItemQty(index, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Unit price */}
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input
                            type="number" min="0"
                            className="h-7 text-right text-sm"
                            placeholder="Precio unit."
                            value={item.unitPrice || ''}
                            onChange={e => {
                              const updated = [...editForm.items];
                              updated[index] = { ...updated[index], unitPrice: parseFloat(e.target.value) || 0 };
                              setEditForm({ ...editForm, items: updated });
                            }}
                          />
                        </div>
                        {/* Subtotal */}
                        <div className="text-right flex-shrink-0 w-24">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="text-sm font-semibold">
                            {subtotal > 0 ? `$${subtotal.toLocaleString('es-CL')}` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {editForm.items.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">Sin productos</p>
                )}
              </div>

              {/* Stamping */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de estampado</p>
                <Select
                  value={editForm.stampingTypeId || 'none'}
                  onValueChange={(v) => {
                    const type = stampingTypes.find(t => t.id === v);
                    setEditForm({
                      ...editForm,
                      stampingTypeId: v === 'none' ? '' : v,
                      stampingPrice: type ? String(type.price) : '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin estampado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin estampado</SelectItem>
                    {stampingTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-medium">{t.name}</span>
                        {(t.minUnits != null || t.maxUnits != null) && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            ({t.minUnits ?? 0}–{t.maxUnits ?? '∞'} u.)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editForm.stampingTypeId && (
                  <div className="space-y-1">
                    <Label className="text-xs">Precio estampado (CLP)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number" min="0"
                        className="h-8"
                        value={editForm.stampingPrice}
                        onChange={e => setEditForm({ ...editForm, stampingPrice: e.target.value })}
                      />
                      {(() => {
                        const type = stampingTypes.find(t => t.id === editForm.stampingTypeId);
                        return type && editForm.stampingPrice !== String(type.price) ? (
                          <Button
                            variant="ghost" size="sm" className="text-xs text-muted-foreground h-8 px-2"
                            onClick={() => setEditForm({ ...editForm, stampingPrice: String(type.price) })}
                          >
                            Restablecer
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              {(() => {
                const totalUnits = editForm.items.reduce((s, i) => s + i.quantity, 0);
                const subtotalProductos = editForm.items.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0);
                const subtotalEstampado = editForm.stampingTypeId ? (parseFloat(editForm.stampingPrice) || 0) : 0;
                const neto = subtotalProductos + subtotalEstampado;
                const shippingCost = editForm.shippingService ? (parseFloat(editForm.shippingPrice) || 0) : 0;
                const stampingPerUnit = totalUnits > 0 ? subtotalEstampado / totalUnits : 0;
                const sumaValoresUnitarios = editForm.items.reduce((s, i) =>
                  s + Math.round((i.unitPrice || 0) + stampingPerUnit) * i.quantity, 0);
                const ganancia = Math.round(sumaValoresUnitarios * 0.5);
                const base = neto + ganancia;
                const iva = Math.round(base * 0.19);
                const total = base + iva + shippingCost;
                return (
                  <div className="border rounded-lg p-4 space-y-2.5 bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen de valores</p>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total unidades</span>
                      <span className="font-medium">{totalUnits}</span>
                    </div>

                    {/* Total de inversión */}
                    <div className="border rounded-md overflow-hidden">
                      <div className="flex justify-between text-sm font-semibold px-3 py-2 bg-muted">
                        <span>Total de inversión</span>
                        <span>${neto.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="divide-y">
                        <div className="flex justify-between text-sm px-3 py-1.5 pl-5">
                          <span className="text-muted-foreground">Productos</span>
                          <span>${subtotalProductos.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-sm px-3 py-1.5 pl-5">
                          <span className="text-muted-foreground">
                            {editForm.stampingTypeId
                              ? (stampingTypes.find(t => t.id === editForm.stampingTypeId)?.name ?? 'Estampado')
                              : 'Estampado'}
                          </span>
                          <span>{subtotalEstampado > 0 ? `$${subtotalEstampado.toLocaleString('es-CL')}` : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {editForm.items.length > 0 && (
                      <div className="border-t pt-2.5 space-y-1.5">
                        <p className="text-xs text-muted-foreground font-medium">
                          Valor unitario por producto
                          {subtotalEstampado > 0 && (
                            <span className="font-normal ml-1 opacity-70">
                              (incl. ${Math.round(stampingPerUnit).toLocaleString('es-CL')} estampado c/u)
                            </span>
                          )}
                        </p>
                        {editForm.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm pl-1">
                            <span className="text-muted-foreground truncate mr-2 max-w-[55%]">
                              {item.productName}
                              <span className="ml-1 text-xs opacity-60">×{item.quantity}</span>
                            </span>
                            <span className="font-medium flex-shrink-0">
                              ${Math.round((item.unitPrice || 0) + stampingPerUnit).toLocaleString('es-CL')} c/u
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between text-sm border-t pt-2.5">
                      <span className="text-muted-foreground">Ganancia (50%)</span>
                      <span className="font-medium text-emerald-600">${ganancia.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2.5">
                      <span>Base</span>
                      <span>${base.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (19%)</span>
                      <span className="font-medium">${iva.toLocaleString('es-CL')}</span>
                    </div>
                    {shippingCost > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2.5">
                        <span className="text-muted-foreground">
                          Despacho
                          <span className="ml-1 text-xs opacity-70 capitalize">
                            ({editForm.shippingService === 'santiago' ? 'Santiago' : 'Regiones'})
                          </span>
                        </span>
                        <span className="font-medium">${shippingCost.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-2.5">
                      <span>Total</span>
                      <span className="text-primary">${total.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

          </Tabs>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="sm:max-w-[92vw] w-[92vw] h-[92vh] max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
            <div>
              <DialogTitle className="text-base font-semibold">
                Vista previa — <span className="text-primary font-mono">{selectedQuote?.quoteNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Revisa el documento antes de descargarlo. Los precios mostrados son los finales para el cliente.
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPdfPreviewOpen(false)}>
              Cerrar
            </Button>
          </div>
          <div className="flex-1 min-h-0 p-4">
            {pdfPreviewOpen && selectedQuote && (
              <QuotePDFPreview
                quoteNumber={selectedQuote.quoteNumber}
                createdAt={selectedQuote.createdAt}
                customerName={editForm.customerName || selectedQuote.customerName}
                customerEmail={editForm.customerEmail || selectedQuote.customerEmail}
                customerPhone={editForm.customerPhone || selectedQuote.customerPhone}
                customerCompany={editForm.customerCompany || selectedQuote.customerCompany}
                items={editForm.items.length ? editForm.items : selectedQuote.items}
                stampingType={stampingTypes.find(t => t.id === editForm.stampingTypeId) ?? selectedQuote.stampingType}
                stampingPrice={editForm.stampingPrice ? parseFloat(editForm.stampingPrice) : selectedQuote.stampingPrice}
                shippingService={editForm.shippingService || selectedQuote.shippingService}
                shippingPrice={editForm.shippingPrice ? parseFloat(editForm.shippingPrice) : (selectedQuote.shippingPrice ?? 0)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductOpen} onOpenChange={(o) => { if (!o) resetAddProduct(); else setAddProductOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `Configura la cantidad para "${selectedProduct.name}"` : 'Busca un producto para agregarlo a la cotización.'}
            </DialogDescription>
          </DialogHeader>

          {!selectedProduct ? (
            /* ── FASE 1: Búsqueda ── */
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Buscar por nombre o código..."
                  className="pl-9"
                  value={productSearch}
                  onChange={e => searchProducts(e.target.value)}
                />
              </div>

              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {searchingProducts && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searchingProducts && productSearch && productResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">Sin resultados</p>
                )}
                {!searchingProducts && !productSearch && (
                  <p className="text-center text-sm text-muted-foreground py-6">Escribe para buscar productos</p>
                )}
                {productResults.map(product => (
                  <button
                    key={product.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => { setSelectedProduct(product); setSelectedQty(1); }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{product.productId}</p>
                      <p className="text-sm font-medium truncate">{product.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {product.price ? (
                        <p className="text-sm font-semibold text-primary">${product.price.toLocaleString('es-CL')}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin precio</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={resetAddProduct}>Cancelar</Button>
              </div>
            </div>
          ) : (
            /* ── FASE 2: Cantidad ── */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{selectedProduct.productId}</p>
                  <p className="text-sm font-semibold truncate">{selectedProduct.name}</p>
                  {selectedProduct.price && (
                    <p className="text-xs text-primary font-medium mt-0.5">${selectedProduct.price.toLocaleString('es-CL')} / u.</p>
                  )}
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0" onClick={() => setSelectedProduct(null)}>
                  Cambiar
                </button>
              </div>

              <div className="space-y-2">
                <Label>Cantidad</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon" className="h-9 w-9"
                    onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                    disabled={selectedQty <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number" min={1}
                    className="w-20 text-center font-semibold"
                    value={selectedQty}
                    onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <Button
                    variant="outline" size="icon" className="h-9 w-9"
                    onClick={() => setSelectedQty(q => q + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {selectedProduct.price && (
                  <p className="text-xs text-muted-foreground">
                    Subtotal: <span className="font-semibold text-foreground">${(selectedProduct.price * selectedQty).toLocaleString('es-CL')}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetAddProduct}>Cancelar</Button>
                <Button size="sm" onClick={confirmAddProduct}>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cotización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la cotización &quot;{quoteToDelete?.quoteNumber}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
