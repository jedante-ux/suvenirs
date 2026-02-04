'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import CartDrawer from '@/components/cart/CartDrawer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith('/gestion');

  if (isAdminPanel) {
    // Panel de gestión: sin Header, Footer ni WhatsApp
    return <main>{children}</main>;
  }

  // Páginas públicas: con Header, Footer y WhatsApp
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </>
  );
}
