'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, FileText, Users, AlertTriangle, Star, Loader2, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatusBadgeClass, getStatusLabel } from '@/lib/statusBadge';
import { Button } from '@/components/ui/button';

const API_URL = '/api';

interface DashboardData {
  products: {
    total: number;
    active: number;
    featured: number;
    outOfStock: number;
  };
  users: {
    total: number;
  };
  quotes: {
    total: number;
    pending: number;
    recent: any[];
  };
}

interface MonthlySalesData {
  year: number;
  month: number;
  monthName: string;
  sales: {
    count: number;
    totalUnits: number;
    totalAmount: number;
    totalQuotes: number;
    conversionRate: string;
  };
}

// Format number as CLP currency
function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<MonthlySalesData | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboard();
    }
  }, [authLoading]);

  // Fetch monthly sales data
  useEffect(() => {
    const fetchMonthlySales = async () => {
      setSalesLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/admin/sales/monthly?year=${selectedYear}&month=${selectedMonth}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await res.json();
        if (result.success) {
          setSalesData(result.data);
        }
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
      } finally {
        setSalesLoading(false);
      }
    };

    if (!authLoading) {
      fetchMonthlySales();
    }
  }, [authLoading, selectedYear, selectedMonth]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

    if (!isCurrentMonth) {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Check if we can go to next month
  const canGoNext = () => {
    const now = new Date();
    return !(selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1);
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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{data?.products.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.products.active || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Destacados</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Star className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{data?.products.featured || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marcados como destacados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{data?.quotes.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.quotes.pending || 0} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-destructive">{data?.products.outOfStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Productos agotados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Sales Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ventas del Mes
              </CardTitle>
              <CardDescription>
                Resumen de ventas completadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[140px]">
                <span className="font-medium capitalize">
                  {salesData?.monthName || ''} {selectedYear}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                disabled={!canGoNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Vendido</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCLP(salesData?.sales.totalAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-xl border border-secondary">
                <div className="flex items-center gap-2 text-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Unidades Vendidas</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {salesData?.sales.totalUnits.toLocaleString('es-CL') || 0}
                </p>
              </div>
              <div className="p-4 bg-accent/30 rounded-xl border border-accent">
                <div className="flex items-center gap-2 text-accent-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Ventas Completadas</span>
                </div>
                <p className="text-2xl font-bold text-accent-foreground">
                  {salesData?.sales.count || 0}
                  <span className="text-sm font-normal ml-2">
                    de {salesData?.sales.totalQuotes || 0} cotizaciones
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones Recientes</CardTitle>
          <CardDescription>Últimas solicitudes de cotización recibidas</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.quotes.recent && data.quotes.recent.length > 0 ? (
            <div className="space-y-4">
              {data.quotes.recent.map((quote: any) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{quote.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.totalItems} productos - {quote.totalUnits} unidades
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeClass(quote.status)}>
                    {getStatusLabel(quote.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay cotizaciones recientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
