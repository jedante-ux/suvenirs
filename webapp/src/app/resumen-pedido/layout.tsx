import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resumen del Pedido',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
