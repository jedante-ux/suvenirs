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
  Grid3X3, Boxes, ArrowRight,
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

const navLinks = [
  { name: 'Blog', href: '/blog' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Contacto', href: '/contacto' },
];


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const prevCountRef = useRef(0);
  const pathname = usePathname();
  const { openCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats.filter(c => c.productCount > 0).sort((a, b) => b.productCount - a.productCount).slice(0, 16));
    }).catch(() => {});
  }, []);

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
      'fixed top-0 left-0 right-0 z-50 text-center py-1.5 text-xs font-medium text-white transition-all duration-300',
      isScrolled ? 'opacity-0 -translate-y-full' : 'opacity-100'
    )} style={{ background: 'linear-gradient(90deg, #FE248A, #D3DC2A, #F47920)' }}>
      ¡Respuesta en menos de 24 horas!
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
                    'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent border-b-2 border-transparent hover:border-accent transition-all duration-300',
                    !isScrolled && 'text-white hover:text-white/80',
                    (pathname === '/productos' || pathname === '/categorias' || pathname === '/kits') && 'border-accent'
                  )}
                >
                  Productos
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[680px] p-5">
                    {/* Quick links row */}
                    <div className="flex gap-2 mb-4 pb-4 border-b border-border/60">
                      <NavigationMenuLink asChild>
                        <Link href="/productos" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                          <Grid3X3 className="h-4 w-4" />
                          Todos los productos
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/categorias" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                          <Package className="h-4 w-4" />
                          Ver categorías
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/kits" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                          <Boxes className="h-4 w-4" />
                          Kits Corporativos
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    {/* Categories grid */}
                    <div className="grid grid-cols-4 gap-1">
                      {categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                          <NavigationMenuLink key={cat.id} asChild>
                            <Link
                              href={`/productos?category=${cat.slug}`}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors group"
                            >
                              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                    {/* Footer link */}
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <NavigationMenuLink asChild>
                        <Link href="/categorias" className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                          Ver todas las categorías
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </NavigationMenuLink>
                    </div>
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
                        'bg-transparent hover:bg-transparent focus:bg-transparent border-b-2 border-transparent hover:border-accent transition-all duration-300',
                        !isScrolled && 'text-white hover:text-white/80',
                        pathname === link.href && 'border-accent'
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
                <nav className="flex flex-col gap-2 mt-8">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">Productos</p>
                  <Button variant="ghost" className="w-full justify-start text-base font-medium" asChild>
                    <Link href="/productos" onClick={() => setIsOpen(false)}>
                      <Grid3X3 className="mr-2 h-4 w-4 text-primary" /> Todos los productos
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-base font-medium" asChild>
                    <Link href="/categorias" onClick={() => setIsOpen(false)}>
                      <Package className="mr-2 h-4 w-4 text-primary" /> Categorías
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-base font-medium" asChild>
                    <Link href="/kits" onClick={() => setIsOpen(false)}>
                      <Boxes className="mr-2 h-4 w-4 text-primary" /> Kits Corporativos
                    </Link>
                  </Button>
                  <div className="border-t border-border/60 my-2" />
                  {navLinks.map((link) => (
                    <Button key={link.name} variant="ghost" className="w-full justify-start text-base font-medium" asChild>
                      <Link href={link.href} onClick={() => setIsOpen(false)}>{link.name}</Link>
                    </Button>
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
