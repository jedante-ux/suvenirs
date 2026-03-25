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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MenuIcon, CartIcon, ChevronDownIcon } from '../icons';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

const navLinks = [
  {
    name: 'Productos',
    href: '/productos',
    submenu: [
      { name: 'Todos los productos', href: '/productos', description: 'Explora todo nuestro catálogo' },
      { name: 'Categorías', href: '/categorias', description: 'Navega por categorías' },
      { name: 'Kits Corporativos', href: '/kits', description: 'Combos pre-armados para empresas' },
    ],
  },
  { name: 'Blog', href: '/blog' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Contacto', href: '/contacto' },
];


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const prevCountRef = useRef(0);
  const pathname = usePathname();
  const { openCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

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
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-border/50' : 'bg-transparent'
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
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.name}>
                  {link.submenu ? (
                    <>
                      <NavigationMenuTrigger
                        className={cn(
                          'bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent border-b-2 border-transparent hover:border-accent transition-all duration-300',
                          !isScrolled && 'text-white hover:text-white/80',
                          link.submenu?.some(sub => pathname === sub.href) && 'border-accent'
                        )}
                      >
                        {link.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          {link.submenu.map((sublink) => (
                            <li key={sublink.name}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={sublink.href}
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {sublink.name}
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {sublink.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
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
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Button variant="ghost" size="icon" className={cn("relative transition-colors duration-300", !isScrolled && "text-white hover:text-white/80 hover:bg-white/10")} onClick={openCart}>
              <CartIcon size={22} />
              {totalItems > 0 && (
                <Badge
                  className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold shadow-sm ring-2 ring-background transition-transform bg-accent text-accent-foreground hover:bg-accent/90",
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
                <Button variant="ghost" size="icon" className={cn("lg:hidden transition-colors duration-300", !isScrolled && "text-white hover:text-white/80 hover:bg-white/10")}>
                  <MenuIcon size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left"><Logo size="sm" /></SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <div key={link.name}>
                      {link.submenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-lg font-medium"
                            >
                              {link.name}
                              <ChevronDownIcon size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {link.submenu.map((sublink) => (
                              <DropdownMenuItem key={sublink.name} asChild>
                                <Link
                                  href={sublink.href}
                                  onClick={() => setIsOpen(false)}
                                  className="cursor-pointer"
                                >
                                  {sublink.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-lg font-medium"
                          asChild
                        >
                          <Link href={link.href} onClick={() => setIsOpen(false)}>
                            {link.name}
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}

                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
