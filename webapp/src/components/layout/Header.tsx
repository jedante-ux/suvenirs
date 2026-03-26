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
  return Package;
}

const popularItems = [
  { name: 'Bolígrafos y Lápices', slug: 'bol-grafos-l-pices-estuches', icon: Pen },
  { name: 'Tazas y Mugs', slug: 'botellas-mugs-tazones-termos-vasos', icon: Coffee },
  { name: 'Galvanos', slug: 'galvanos-de-cristal', icon: Gem },
  { name: 'Llaveros', slug: 'llaveros', icon: KeyRound },
  { name: 'Cuadernos y Libretas', slug: 'libretas-cuadernos-memo-set', icon: BookOpen },
  { name: 'Bolsas Publicitarias', slug: 'bolsas-publicitarias', icon: ShoppingBag },
  { name: 'Encobrizados', slug: '', search: 'cobre', icon: Medal },
  { name: 'Ecológicos', slug: 'l-nea-bamboo', icon: Gift },
];

const techItems = [
  { name: 'Todos los tecnológicos', slug: 'tecnol-gicos', search: '', icon: Laptop },
  { name: 'Parlantes y Bluetooth', slug: '', search: 'parlante bluetooth', icon: Laptop },
  { name: 'Cargadores', slug: '', search: 'cargador', icon: Laptop },
  { name: 'Auriculares', slug: '', search: 'auricular', icon: Laptop },
  { name: 'USB y Pendrive', slug: '', search: 'usb pendrive', icon: Laptop },
  { name: 'Linternas LED', slug: '', search: 'linterna led', icon: Laptop },
  { name: 'Mouse y Accesorios', slug: '', search: 'mouse', icon: Laptop },
];

const navLinks = [
  { name: 'Blog', href: '/blog' },
  { name: 'Nosotros', href: '/nosotros' },
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

  // Parent categories (no parentId) sorted by product count
  const parentCategories = allCategories
    .filter(c => !c.parentId)
    .sort((a, b) => b.productCount - a.productCount);

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
      'fixed top-0 left-0 right-0 z-50 py-1.5 text-xs font-medium text-white transition-all duration-300',
      isScrolled ? 'opacity-0 -translate-y-full' : 'opacity-100'
    )} style={{ background: 'linear-gradient(90deg, #F5D966, #F47920, #F5D966)' }}>
      <div className="container flex items-center justify-between">
        <a href="mailto:contacto@suvenirs.cl" className="hover:underline">contacto@suvenirs.cl</a>
        <span className="flex items-center"><Clock className="inline h-3 w-3 mr-1.5" />¡Respuesta en menos de 24 horas!</span>
        <a href="tel:+56931464930" className="hover:underline">+56 9 3146 4930</a>
      </div>
    </div>
    <header
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'top-0 bg-white/95 backdrop-blur-md border-b border-border/50' : 'top-7 bg-transparent'
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" variant={isScrolled ? 'default' : 'white'} />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Productos megamenu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-all duration-300 hover:opacity-70',
                    !isScrolled && 'text-white hover:text-white/80',
                    isScrolled && (pathname === '/productos' || pathname === '/categorias' || pathname === '/kits') && 'text-primary font-semibold'
                  )}
                >
                  Productos
                </NavigationMenuTrigger>
                <NavigationMenuContent >
                  <div className="flex" onMouseLeave={() => setHoveredParent(null)}>
                    {/* Left panel */}
                    <div className="w-[300px] py-3 border-r border-border/30 max-h-[480px] overflow-y-auto text-left">
                      <NavigationMenuLink asChild>
                        <Link href="/productos" className="flex items-center justify-between px-5 py-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          onMouseEnter={() => setHoveredParent(null)}>
                          Ver todos los productos
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </Link>
                      </NavigationMenuLink>
                      {parentCategories.map((cat) => {
                        const children = getChildren(cat.id);
                        const hasChildren = children.length > 0;
                        return (
                          <NavigationMenuLink key={cat.id} asChild>
                            <Link
                              href={`/productos?category=${cat.slug}`}
                              className={cn(
                                "flex items-center justify-between px-5 py-2.5 text-sm transition-colors",
                                hoveredParent === cat.id ? "bg-muted/60 text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              )}
                              onMouseEnter={() => hasChildren ? setHoveredParent(cat.id) : setHoveredParent(null)}
                            >
                              <span>{cat.name}</span>
                              {hasChildren && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />}
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>

                    {/* Right: subcategories */}
                    {hoveredParent && getChildren(hoveredParent).length > 0 && (
                      <div className="w-[260px] py-3 max-h-[480px] overflow-y-auto text-left">
                        <p className="px-5 pb-2 text-sm font-semibold text-foreground">
                          {parentCategories.find(c => c.id === hoveredParent)?.name}
                        </p>
                        {getChildren(hoveredParent).map((sub) => (
                          <NavigationMenuLink key={sub.id} asChild>
                            <Link
                              href={`/productos?category=${sub.slug}`}
                              className="block px-5 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              {sub.name}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/productos?category=${parentCategories.find(c => c.id === hoveredParent)?.slug}`}
                            className="block px-5 py-1.5 mt-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Ver todo en {parentCategories.find(c => c.id === hoveredParent)?.name} →
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Populares dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-all duration-300 hover:opacity-70',
                    !isScrolled && 'text-white hover:text-white/80',
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
                      return (
                        <NavigationMenuLink key={item.name} asChild>
                          <Link
                            href={href}
                            className="block px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            {item.name}
                          </Link>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tecnología dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-all duration-300 hover:opacity-70',
                    !isScrolled && 'text-white hover:text-white/80',
                  )}
                >
                  Tecnología
                </NavigationMenuTrigger>
                <NavigationMenuContent >
                  <div className="w-[260px] py-3 text-left">
                    {techItems.map((item) => {
                      const href = item.search
                        ? `/productos?search=${encodeURIComponent(item.search)}`
                        : `/productos?category=${item.slug}`;
                      return (
                        <NavigationMenuLink key={item.name} asChild>
                          <Link
                            href={href}
                            className="block px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          >
                            {item.name}
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
                        !isScrolled && 'text-white hover:text-white/80',
                        isScrolled && pathname === link.href && 'text-primary font-semibold'
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
                isScrolled
                  ? "border-primary text-primary bg-transparent hover:bg-transparent"
                  : "border-white text-white bg-transparent hover:bg-transparent"
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
                <Button variant="ghost" size="icon" className={cn("lg:hidden transition-colors duration-300 bg-transparent hover:bg-transparent", !isScrolled && "text-white hover:text-white/80")}>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">Tecnología</p>
                  {techItems.map((item) => {
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
