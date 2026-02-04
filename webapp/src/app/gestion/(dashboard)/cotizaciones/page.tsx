'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Quote } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Eye, Loader2, MessageCircle, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  quoted: 'Cotizado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  completed: 'Completado',
};

const sourceLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  web: 'Web',
  manual: 'Manual',
};

export default function CotizacionesPage() {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const fetchQuotes = async () => {
    try {
      const url = statusFilter === 'all'
        ? `${API_URL}/quotes`
        : `${API_URL}/quotes?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setQuotes(result.data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuotes();
    }
  }, [token, statusFilter]);

  const updateStatus = async (quoteId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();

      if (result.success) {
        setQuotes(quotes.map(q => q._id === quoteId ? { ...q, status: newStatus as Quote['status'] } : q));
        if (selectedQuote?._id === quoteId) {
          setSelectedQuote({ ...selectedQuote, status: newStatus as Quote['status'] });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (!quoteToDelete) return;

    try {
      const res = await fetch(`${API_URL}/quotes/${quoteToDelete._id}`, {
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

  const openWhatsApp = (quote: Quote) => {
    const phone = quote.customerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(
      `Hola ${quote.customerName || ''}, con respecto a su cotización ${quote.quoteNumber}...`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
      <div>
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <p className="text-muted-foreground">Gestiona las solicitudes de cotización</p>
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
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="quoted">Cotizado</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
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
                <TableRow key={quote._id}>
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
                    <Badge variant="outline">{sourceLabels[quote.source]}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={quote.status}
                      onValueChange={(value) => updateStatus(quote._id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={statusColors[quote.status]}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {new Date(quote.createdAt).toLocaleDateString('es-CL')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedQuote(quote);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quote.customerPhone && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600"
                          onClick={() => openWhatsApp(quote)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => {
                          setQuoteToDelete(quote);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron cotizaciones
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
            <DialogDescription>
              Detalles completos de la solicitud
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedQuote.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedQuote.customerCompany || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedQuote.customerEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedQuote.customerPhone || '-'}</p>
                </div>
              </div>

              {/* Products */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Productos solicitados</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{item.productId}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total productos</p>
                  <p className="text-xl font-bold">{selectedQuote.totalItems}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total unidades</p>
                  <p className="text-xl font-bold">{selectedQuote.totalUnits}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedQuote.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm p-3 bg-muted rounded-lg">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estado actual</p>
                  <Select
                    value={selectedQuote.status}
                    onValueChange={(value) => updateStatus(selectedQuote._id, value)}
                  >
                    <SelectTrigger className="w-40 mt-1">
                      <Badge className={statusColors[selectedQuote.status]}>
                        {statusLabels[selectedQuote.status]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedQuote.customerPhone && (
                  <Button onClick={() => openWhatsApp(selectedQuote)} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp
                  </Button>
                )}
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
              ¿Estás seguro de que deseas eliminar la cotización "{quoteToDelete?.quoteNumber}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
