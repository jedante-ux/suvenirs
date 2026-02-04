'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, FileText, Users, AlertTriangle, Star, Loader2, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  const { token } = useAuth();
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

    if (token) {
      fetchDashboard();
    }
  }, [token]);

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

    if (token) {
      fetchMonthlySales();
    }
  }, [token, selectedYear, selectedMonth]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.products.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.products.active || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Destacados</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.products.featured || 0}</div>
            <p className="text-xs text-muted-foreground">
              Marcados como destacados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.quotes.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.quotes.pending || 0} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{data?.products.outOfStock || 0}</div>
            <p className="text-xs text-muted-foreground">
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
                <TrendingUp className="h-5 w-5 text-green-500" />
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
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Vendido</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCLP(salesData?.sales.totalAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Unidades Vendidas</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {salesData?.sales.totalUnits.toLocaleString('es-CL') || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Ventas Completadas</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
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
                  key={quote._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
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
                  <Badge className={statusColors[quote.status]}>
                    {statusLabels[quote.status]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay cotizaciones recientes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
