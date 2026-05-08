'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  LogOut,
  Loader2,
  Menu,
  X,
  FolderTree,
  Newspaper,
  Boxes,
  Paintbrush,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/gestion', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gestion/productos', label: 'Productos', icon: Package },
  { href: '/gestion/categorias', label: 'Categorías', icon: FolderTree },
  { href: '/gestion/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { href: '/gestion/kits', label: 'Kits', icon: Boxes },
  { href: '/gestion/personalizar', label: 'Personalizar', icon: Paintbrush },
  { href: '/gestion/blog', label: 'Blog', icon: Newspaper },
  { href: '/gestion/usuarios', label: 'Usuarios', icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/gestion/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/gestion/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b bg-primary/5">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">S</span>
              </div>
              <Logo size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-9">Panel de Gestión</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === '/gestion'
                ? pathname === '/gestion'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-[10px]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-background border border-border">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-xs font-bold text-primary-foreground">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
