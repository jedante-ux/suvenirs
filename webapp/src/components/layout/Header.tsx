'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { MenuIcon, CartIcon } from '../icons';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { Category } from '@/types';
import { getCategories } from '@/lib/api';
import {
  Gift, Trophy, Pen, Coffee, ShoppingBag, Package, Star, Gem,
  Medal, KeyRound, Stamp, Wine, Laptop, BookOpen, Briefcase, Box,
  Grid3X3, Boxes, ArrowRight, Clock,
} from 'lucide-react';

// Map category name to icon
function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('trofeo') || n.includes('copa') || n.includes('torre')) return Trophy;
  if (n.includes('medalla')) return Medal;
  if (n.includes('llavero')) return KeyRound;
  if (n.includes('bolígrafo') || n.includes('lápic') || n.includes('libreta') || n.includes('cuaderno')) return Pen;
  if (n.includes('botella') || n.includes('mug') || n.includes('taz') || n.includes('termo') || n.includes('vaso')) return Coffee;
  if (n.includes('bolsa') || n.includes('mochila') || n.includes('bolso')) return ShoppingBag;
  if (n.includes('vino') || n.includes('descorchador')) return Wine;
  if (n.includes('tecnológ') || n.includes('usb')) return Laptop;
  if (n.includes('timbre') || n.includes('sello')) return Stamp;
  if (n.includes('galvano') || n.includes('cristal')) return Gem;
  if (n.includes('set de regalo') || n.includes('kit')) return Gift;
  if (n.includes('placa')) return Star;
  if (n.includes('caja') || n.includes('estuche') || n.includes('packaging')) return Box;
  if (n.includes('lanyard') || n.includes('identificación')) return Briefcase;
  if (n.includes('bamboo')) return BookOpen;
  if (n.includes('accesorio') || n.includes('herramienta')) return Briefcase;
  if (n.includes('parrill') || n.includes('destapador')) return Wine;
  if (n.includes('yute') || n.includes('saco')) return ShoppingBag;
  if (n.includes('novedade')) return Star;
  return Package;
}

import { getCategoryDisplayName } from '@/lib/categoryDisplayNames';

const popularItems = [
  { name: 'Bolígrafos y Lápices', slug: 'bol-grafos-l-pices-estuches', search: '' },
  { name: 'Bolsas Publicitarias', slug: 'bolsas-publicitarias', search: '' },
  { name: 'Cuadernos y Libretas', slug: 'libretas-cuadernos-memo-set', search: '' },
  { name: 'Ecológicos', slug: 'l-nea-bamboo', search: '' },
  { name: 'Encobrizados', slug: '', search: 'cobre' },
  { name: 'Galvanos', slug: 'galvanos-de-cristal', search: '' },
  { name: 'Llaveros', slug: 'llaveros', search: '' },
  { name: 'Tazas y Mugs', slug: 'botellas-mugs-tazones-termos-vasos', search: '' },
  { name: 'Tecnológicos', slug: 'tecnol-gicos', search: '' },
];

const navLinks = [
  { name: 'Kits', href: '/kits' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
];


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const pathname = usePathname();
  const { openCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    getCategories().then(cats => {
      setAllCategories(cats.filter(c => c.productCount > 0));
    }).catch(() => {});
  }, []);

  // All categories sorted alphabetically by display name
  const parentCategories = allCategories
    .sort((a, b) => getCategoryDisplayName(a.name).localeCompare(getCategoryDisplayName(b.name), 'es'));

  // Get children for a given parent
  const getChildren = (parentId: string) =>
    allCategories.filter(c => c.parentId === parentId).sort((a, b) => b.productCount - a.productCount);

  // Animate badge when count changes
  useEffect(() => {
    if (totalItems > prevCountRef.current && totalItems > 0) {
      setBadgePop(true);
      const timer = setTimeout(() => setBadgePop(false), 300);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalItems;
  }, [totalItems]);

  // Pages with colored hero (pink bg) vs white bg pages
  const isHeroPage = pathname === '/';
  const showDarkNav = isScrolled || !isHeroPage;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
    {/* Top announcement bar */}
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 py-2.5 text-xs font-medium text-[#6B1035]',
    )} style={{ backgroundColor: '#E8B0BD' }}>
      <div className="container flex items-center justify-center gap-4">
        <span className="flex items-center"><Clock className="inline h-3 w-3 mr-1.5" />¡Respuesta en menos de 24 horas!</span>
        <Link href="/productos" className="bg-[#6B1035] text-white font-bold px-3 py-0.5 rounded-full hover:bg-[#6B1035]/80 transition-colors text-[11px]">
          Cotizar ahora
        </Link>
      </div>
    </div>
    <header
      className={cn(
        'fixed left-0 right-0 z-50 top-9 transition-all duration-300',
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : (isHeroPage ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md')
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" variant={showDarkNav ? 'default' : 'white'} />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Categorías megamenu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-all duration-300 hover:opacity-70',
                    !showDarkNav && 'text-white hover:text-white/80',
                    showDarkNav && (pathname === '/productos' || pathname === '/categorias' || pathname === '/kits') && 'text-primary font-semibold'
                  )}
                >
                  Categorías
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[260px] py-3 max-h-[480px] overflow-y-auto text-left">
                    <NavigationMenuLink asChild>
                      <Link href="/productos" className="block px-5 py-2.5 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted/40 transition-colors">
                        Ver todos los productos
                      </Link>
                    </NavigationMenuLink>
                    {parentCategories.map((cat) => {
                      const Icon = getCategoryIcon(cat.name);
                      const displayName = getCategoryDisplayName(cat.name);
                      return (
                        <NavigationMenuLink key={cat.id} asChild>
                          <Link
                            href={`/productos?category=${cat.slug}`}
                            className="!flex !flex-row !items-center gap-2.5 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{displayName}</span>
                          </Link>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Populares dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-all duration-300 hover:opacity-70',
                    !showDarkNav && 'text-white hover:text-white/80',
                  )}
                >
                  Populares
                </NavigationMenuTrigger>
                <NavigationMenuContent >
                  <div className="w-[260px] py-3 text-left">
                    {popularItems.map((item) => {
                      const href = item.search
                        ? `/productos?search=${encodeURIComponent(item.search)}`
                        : `/productos?category=${item.slug}`;
                      const Icon = getCategoryIcon(item.name);
                      return (
                        <NavigationMenuLink key={item.name} asChild>
                          <Link
                            href={href}
                            className="!flex !flex-row !items-center gap-2.5 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Other nav links */}
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent hover:bg-transparent focus:bg-transparent transition-all duration-300 hover:opacity-70',
                        !showDarkNav && 'text-white hover:text-white/80',
                        showDarkNav && pathname === link.href && 'text-primary font-semibold'
                      )}
                    >
                      {link.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Button
              variant="outline"
              className={cn(
                "relative rounded-full px-4 gap-2 transition-all duration-300",
                showDarkNav
                  ? "border-primary bg-primary text-white hover:bg-primary/90"
                  : "border-white/30 text-[#6B1035] bg-white hover:bg-white/90"
              )}
              onClick={openCart}
            >
              <CartIcon size={18} />
              Carrito
              {totalItems > 0 && (
                <Badge
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center px-1 text-[10px] font-bold transition-transform bg-accent text-accent-foreground",
                    badgePop && "animate-badge-pop"
                  )}
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("lg:hidden transition-colors duration-300 bg-transparent hover:bg-transparent", !showDarkNav && "text-white hover:text-white/80")}>
                  <MenuIcon size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left"><Logo size="sm" /></SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 mt-8 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">Productos</p>
                  <Link href="/productos" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Todos los productos
                  </Link>
                  <Link href="/categorias" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Categorías
                  </Link>
                  <Link href="/kits" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Kits Corporativos
                  </Link>
                  <div className="border-t border-border/60 my-2" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">Populares</p>
                  {popularItems.map((item) => {
                    const href = item.search
                      ? `/productos?search=${encodeURIComponent(item.search)}`
                      : `/productos?category=${item.slug}`;
                    return (
                      <Link key={item.name} href={href} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                        {item.name}
                      </Link>
                    );
                  })}
                  <div className="border-t border-border/60 my-2" />
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{link.name}</Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
